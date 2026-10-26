import { createLocalNlpAssistant } from '../assistant.ts';
import { detectLanguage } from '../text/language.ts';
import type { EmotionLabel, Language, RiskLevel } from '../types.ts';
import { CHATBOT_VERSION, resolveChatbotConfig } from './config.ts';
import { normalizeChatInput, detectExactChatControl } from './normalize.ts';
import { ChatIntentRouter } from './routing/router.ts';
import { evaluateChatSafety, safetyResponse } from './safety/policy.ts';
import { getChatResponse } from './localization/responses.ts';
import { EphemeralChatSessionStore } from './context/session-store.ts';
import { buildProviderMessages } from './generation/prompt-builder.ts';
import { runProviderSafely } from './generation/provider-runner.ts';
import { guardGeneratedResponse } from './generation/output-guard.ts';
import { maySendConversationHistory, maySendCurrentMessage, normalizeChatConsent } from './privacy/consent.ts';
import { recommendChatActions } from './tools/action-recommender.ts';
import { resolveRepairIntent, detectRepairHint } from './routing/repair.ts';
import { decideModelRoute } from './generation/model-policy.ts';
import { reviewResponse } from './quality/response-review.ts';
import { LocalKnowledgeRetriever } from './knowledge/retriever.ts';
import { ChatProviderCircuitBreaker } from './generation/circuit-breaker.ts';
import { auditRemotePayload } from './privacy/remote-payload-audit.ts';
import { fitProviderMessages } from './generation/context-budget.ts';
import { formatChatDisplayText } from './response/formatting.ts';
import { applyActionPolicy } from './tools/action-policy.ts';
import { LocalChatFeedbackCounter } from './quality/feedback.ts';
import type {
  BaseNlpPort, ChatAction, ChatDirectControls, ChatIntent, ChatModelProvider, ChatProfile, ChatToolId,
  ChatRequest, ChatSafetySummary, ChatTurnMetadata, ChatTurnResult, ChatbotConfig, ResponseSource,
} from './types.ts';

export interface ChatbotOptions {
  config?: Partial<ChatbotConfig>;
  nlp?: BaseNlpPort;
  provider?: ChatModelProvider;
  controls?: ChatDirectControls;
  sessionStore?: EphemeralChatSessionStore;
  feedbackCounter?: LocalChatFeedbackCounter;
  knowledgeRetriever?: LocalKnowledgeRetriever;
  providerCircuitBreaker?: ChatProviderCircuitBreaker;
  availableActionIds?: ChatToolId[];
  now?: () => number;
}

/**
 * Chatbot coordinator: deterministic controls and safety routing precede model generation.
 * The default mode is local templates + local NLP, with remote generation disabled.
 */
export class EmDrChatbot {
  readonly config: ChatbotConfig;
  readonly sessions: EphemeralChatSessionStore;
  readonly feedback: LocalChatFeedbackCounter;
  private readonly nlp: BaseNlpPort;
  private readonly provider?: ChatModelProvider;
  private readonly controls: ChatDirectControls;
  private readonly router = new ChatIntentRouter();
  private readonly knowledge: LocalKnowledgeRetriever;
  private readonly providerBreaker: ChatProviderCircuitBreaker;
  private readonly availableActionIds?: ChatToolId[];
  private readonly now: () => number;

  constructor(options: ChatbotOptions = {}) {
    this.config = resolveChatbotConfig(options.config);
    this.nlp = options.nlp ?? createLocalNlpAssistant();
    this.provider = options.provider;
    this.controls = options.controls ?? {};
    this.sessions = options.sessionStore ?? new EphemeralChatSessionStore({
      maxConversations: this.config.maxConversations,
      maxHistoryTurns: this.config.maxHistoryTurns,
      maxHistoryChars: this.config.maxHistoryChars,
      ttlMs: this.config.conversationTtlMs,
      now: options.now,
    });
    this.feedback = options.feedbackCounter ?? new LocalChatFeedbackCounter();
    this.knowledge = options.knowledgeRetriever ?? new LocalKnowledgeRetriever();
    this.providerBreaker = options.providerCircuitBreaker ?? new ChatProviderCircuitBreaker({ now: options.now });
    this.availableActionIds = options.availableActionIds ? [...options.availableActionIds] : undefined;
    this.now = options.now ?? Date.now;
  }

  async respond(request: ChatRequest, signal?: AbortSignal): Promise<ChatTurnResult> {
    const start = this.now();
    const normalized = normalizeChatInput(request.text, this.config.maxInputChars);
    const conversationId = safeConversationId(request.conversationId);
    const consent = normalizeChatConsent(request.consent);
    // Exact, standalone pause/stop requests bypass all language-model logic.
    const directControl = detectExactChatControl(normalized.text);
    if (directControl !== 'none') {
      return this.handleDirectControl({
        request, conversationId, normalized, directControl,
        elapsed: () => Math.max(0, this.now() - start),
      });
    }
    if (normalized.wasEmpty) return this.emptyResult(request, conversationId, () => Math.max(0, this.now() - start));

    const nlpResponse = await this.nlp.process({ text: normalized.text, conversationId });
    const language = nlpResponse.language;
    const priorSession = this.sessions.read(conversationId);
    let route = this.router.route(normalized.text, language);
    const repair = resolveRepairIntent(detectRepairHint(normalized.text), priorSession?.previousIntents.at(-1), language);
    if (repair && route.intent === 'unknown') route = repair;
    const safety = evaluateChatSafety(String(request.text ?? '').slice(0, Math.max(this.config.maxInputChars, 8000)), language);
    const turnNumber = (priorSession?.turnCount ?? 0) + 1;
    let text = '';
    let knowledgeArticleId: string | undefined;
    let source: ResponseSource = 'local_template';
    let usedRemoteModel = false;
    let shouldClarify = route.shouldClarify;

    if (safety.override) {
      text = safetyResponse(safety) ?? getChatResponse('safety_support', language);
      source = 'safety_policy';
      shouldClarify = safety.signal.level === 'high';
    } else if (safety.signal.level === 'possible' && isPossibleHighConcern(safety.signal.category)) {
      text = getChatResponse('uncertain_safety', language, request.profile);
      source = 'safety_policy';
      shouldClarify = true;
    } else if (route.intent === 'privacy') {
      text = getChatResponse('privacy_details', language, request.profile);
      source = 'local_template';
      shouldClarify = false;
    } else if (route.intent === 'unknown' || route.shouldClarify) {
      text = getChatResponse('clarify', language, request.profile);
      source = 'local_template';
      shouldClarify = true;
    } else {
      const retrieved = this.retrieveKnowledgeForIntent(route.intent, normalized.text, language);
      text = retrieved?.answer ?? getChatResponse(route.intent, language, request.profile);
      knowledgeArticleId = retrieved?.articleId;
      source = retrieved ? 'local_nlp' : 'local_template';
      const modelDecision = decideModelRoute({
        providerAvailable: Boolean(this.provider),
        globalRemoteEnabled: this.config.allowRemoteModel,
        localOnly: request.localOnly,
        consent,
        intent: route.intent,
        risk: safety.signal.level,
        userText: normalized.text,
      });
      if (modelDecision.allowed && this.provider) {
        try {
          const includeHistory = maySendConversationHistory(consent, this.config.allowRemoteModel);
          const history = includeHistory ? this.sessions.readTurns(conversationId) : [];
          const candidateMessages = buildProviderMessages({
            userText: normalized.text,
            language,
            intent: route.intent,
            profile: request.profile,
            previousIntents: priorSession?.previousIntents,
            history,
            allowHistory: includeHistory,
            maxInputChars: this.config.maxInputChars,
          });
          const contextFit = fitProviderMessages(candidateMessages, { maxChars: 12000, maxMessages: 12 });
          const messages = contextFit.messages;
          const payloadAudit = contextFit.valid ? auditRemotePayload(messages, { consented: modelDecision.allowed, maxChars: 12000, maxMessages: 12 }) : undefined;
          if (!payloadAudit?.allowed) {
            // Fail closed: retain the local answer if a remote payload fails the final privacy/policy audit.
            source = 'fallback';
          } else if (!this.providerBreaker.canAttempt()) {
            // Provider outage circuit is open; local response remains usable.
            source = 'fallback';
          } else {
            const generated = await runProviderSafely(this.provider, {
              messages,
              maxOutputTokens: this.config.maxOutputTokens,
              temperature: this.config.temperature,
              signal,
              metadata: { purpose: 'wellbeing_companion', language, requestId: request.requestId },
            }, this.config.remoteTimeoutMs, signal);
            this.providerBreaker.recordSuccess();
            const guarded = guardGeneratedResponse(generated.text, { maxOutputChars: this.config.maxOutputChars });
            const quality = guarded.safe ? reviewResponse(guarded.text, { intent: route.intent, profile: request.profile, maximumChars: this.config.maxOutputChars }) : undefined;
            if (guarded.safe && quality?.accepted) {
              text = guarded.text;
              source = 'remote_model';
              usedRemoteModel = true;
            }
          }
        } catch {
          this.providerBreaker.recordFailure();
          // Local template remains the fallback. Never leak provider errors or input to logs.
          source = 'fallback';
        }
      }
    }

    text = formatChatDisplayText(capOutput(text, this.config.maxOutputChars), { maxChars: this.config.maxOutputChars }).text;
    const risk = safety.signal.level;
    const metadata: ChatTurnMetadata = {
      intent: safety.override ? 'safety_support' : route.intent,
      emotion: nlpResponse.emotion.label,
      risk,
      language,
      timestamp: this.now(),
    };
    const session = this.sessions.update(conversationId, metadata);
    const retainText = consent.retainLocalConversationText;
    this.sessions.appendTextTurn(conversationId, 'user', normalized.text, retainText);
    this.sessions.appendTextTurn(conversationId, 'assistant', text, retainText);

    const actions = this.actionsFor(route.intent, language, safety.override, false);
    const safetySummary = makeSafetySummary(risk, safety.signal.category, 'none', safety.override, safety.reasonCode, safety.requiresHumanSupport);
    return {
      requestId: request.requestId,
      conversationId,
      text,
      language,
      intent: safety.override ? 'safety_support' : route.intent,
      intentConfidence: route.confidence,
      shouldClarify,
      actions,
      safety: safetySummary,
      source,
      usedRemoteModel,
      profileApplied: profileKeys(request.profile),
      metadata: {
        processingMs: Math.max(0, this.now() - start),
        inputChars: Math.min(normalized.originalLength, this.config.maxInputChars),
        outputChars: text.length,
        turnNumber: session.turnCount,
        pipelineVersion: CHATBOT_VERSION,
        knowledgeArticleId,
      },
    };
  }

  /** Erases one conversation or all local session state. It does not clear OS logs or provider data. */
  forget(conversationId?: string): void {
    this.sessions.clear(conversationId);
    this.nlp.forget?.(conversationId);
  }

  recordFeedback(event: Parameters<LocalChatFeedbackCounter['record']>[0]): void {
    this.feedback.record(event);
  }

  private async handleDirectControl(input: {
    request: ChatRequest;
    conversationId: string;
    normalized: ReturnType<typeof normalizeChatInput>;
    directControl: 'pause' | 'stop';
    elapsed: () => number;
  }): Promise<ChatTurnResult> {
    const likelyLanguage = detectLanguage(input.normalized.text);
    const language = likelyLanguage === 'fr' || likelyLanguage === 'es' ? likelyLanguage : 'en';
    const handler = input.directControl === 'stop' ? this.controls.onStop : this.controls.onPause;
    let handled = false;
    if (handler) {
      try { await handler(); handled = true; } catch { handled = false; }
    }
    const intent: ChatIntent = input.directControl;
    const text = handled
      ? (language === 'fr'
        ? input.directControl === 'stop' ? 'La demande d’arrêt a été transmise au contrôleur de session. Vérifiez que la stimulation est bien arrêtée.' : 'La demande de pause a été transmise au contrôleur de session. Vérifiez l’état affiché.'
        : language === 'es'
          ? input.directControl === 'stop' ? 'La solicitud de parada se envió al controlador de sesión. Comprueba que la estimulación se haya detenido.' : 'La solicitud de pausa se envió al controlador de sesión. Comprueba el estado que aparece en pantalla.'
          : input.directControl === 'stop' ? 'The stop request was sent to the session controller. Verify that stimulation has stopped.' : 'The pause request was sent to the session controller. Verify the on-screen state.')
      : getChatResponse('control_unavailable', language);
    const safetySummary = makeSafetySummary('none', 'none', input.directControl, false, handled ? 'direct_control_dispatched' : 'direct_control_handler_missing', false);
    return {
      requestId: input.request.requestId,
      conversationId: input.conversationId,
      text,
      language,
      intent,
      intentConfidence: 0.999,
      shouldClarify: false,
      actions: this.actionsFor(intent, language, false, true),
      safety: safetySummary,
      source: handled ? 'control_handler' : 'fallback',
      usedRemoteModel: false,
      profileApplied: [],
      metadata: { processingMs: input.elapsed(), inputChars: Math.min(input.normalized.originalLength, this.config.maxInputChars), outputChars: text.length, turnNumber: this.sessions.read(input.conversationId)?.turnCount ?? 0, pipelineVersion: CHATBOT_VERSION },
    };
  }

  private emptyResult(request: ChatRequest, conversationId: string, elapsed: () => number): ChatTurnResult {
    const language: Language = 'en';
    const text = getChatResponse('empty_input', language);
    return {
      requestId: request.requestId,
      conversationId,
      text,
      language,
      intent: 'unknown',
      intentConfidence: 0,
      shouldClarify: true,
      actions: [],
      safety: makeSafetySummary('none', 'none', 'none', false, 'empty_input', false),
      source: 'fallback',
      usedRemoteModel: false,
      profileApplied: [],
      metadata: { processingMs: elapsed(), inputChars: 0, outputChars: text.length, turnNumber: this.sessions.read(conversationId)?.turnCount ?? 0, pipelineVersion: CHATBOT_VERSION },
    };
  }


  private retrieveKnowledgeForIntent(intent: ChatIntent, text: string, language: Language) {
    const searchable: ChatIntent[] = ['app_help', 'explain_emdr', 'grounding', 'breathing', 'professional_support'];
    if (!searchable.includes(intent)) return undefined;
    return this.knowledge.answer(text, { intent, language, minimumScore: 0.23, minimumMargin: 0.025, maxResults: 2 });
  }

  private actionsFor(intent: ChatIntent, language: Language, safetyOverride: boolean, activeSession: boolean): ChatAction[] {
    const suggestions = recommendChatActions({ intent, language, safetyOverride, activeSession });
    return applyActionPolicy(suggestions, { availableActionIds: this.availableActionIds, safetyOverride, maxActions: 4 }).actions;
  }
}

export function createEmdrChatbot(options?: ChatbotOptions): EmDrChatbot { return new EmDrChatbot(options); }

function safeConversationId(value: string | undefined): string {
  const raw = typeof value === 'string' ? value : 'anonymous-session';
  const safe = raw.slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_');
  return safe || 'anonymous-session';
}

function isPossibleHighConcern(category: ChatSafetySummary['category']): boolean {
  return ['suicide', 'self_harm', 'harm_to_others', 'medical_emergency', 'overdose', 'abuse_or_immediate_danger'].includes(category);
}
function capOutput(text: string, maxChars: number): string { return Array.from(text).slice(0, maxChars).join('').trim(); }
function profileKeys(profile: ChatProfile | undefined): Array<keyof ChatProfile> {
  if (!profile) return [];
  return (['tone', 'responseLength', 'language', 'preferredTools'] as Array<keyof ChatProfile>).filter((key) => profile[key] !== undefined);
}
function makeSafetySummary(level: RiskLevel, category: ChatSafetySummary['category'], directControl: ChatSafetySummary['directControl'], responseOverridden: boolean, reasonCode: string, needsHumanSupport: boolean): ChatSafetySummary {
  return { level, category, directControl, responseOverridden, reasonCode, needsHumanSupport };
}

export type { ChatIntent, ChatProfile, ChatRequest, ChatTurnResult } from './types.ts';
