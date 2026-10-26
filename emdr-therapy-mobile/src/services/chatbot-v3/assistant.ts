import { DEFAULT_NLP_CONFIG, PIPELINE_VERSION, resolveConfig } from './config.ts';
import type { NlpConfig, NlpRequest, NlpResponse, SafetyResult } from './types.ts';
import { normalizeUserText } from './text/normalize.ts';
import { classifyIntent } from './intent/classifier.ts';
import { estimateEmotion } from './affect/emotion.ts';
import { detectSafetySignals } from './safety/detector.ts';
import { createSafetyResponse } from './safety/policy.ts';
import { extractEntities } from './entities/extractor.ts';
import { EphemeralConversationContext } from './context/context.ts';
import { resolveFollowUp } from './context/follow-up.ts';
import { planResponse } from './response/planner.ts';
import { getSafetyDisclaimer } from './response/templates.ts';
import type { Intent } from './types.ts';

export interface LocalNlpAssistantOptions { config?: Partial<NlpConfig>; context?: EphemeralConversationContext; }

/**
 * Deterministic local-first conversation helper. It is not a therapist, diagnostic system,
 * clinically validated risk model, or evidence of treatment effectiveness.
 */
export class LocalNlpAssistant {
  readonly config: NlpConfig;
  readonly context: EphemeralConversationContext;

  constructor(options: LocalNlpAssistantOptions = {}) {
    this.config = resolveConfig(options.config);
    this.context = options.context ?? new EphemeralConversationContext();
  }

  async process(request: NlpRequest): Promise<NlpResponse> {
    const start = now();
    const analysis = normalizeUserText(request.text, this.config.maxInputChars, this.config.maxTokens);
    const language = this.config.supportedLanguages.includes(analysis.language) ? analysis.language : 'unknown';
    const conversationId = request.conversationId ?? 'default';
    const previous = this.config.retainConversationState ? this.context.read(conversationId) : undefined;
    const rawIntent = classifyIntent(analysis.normalizedText, this.config, language);
    const followUp = resolveFollowUp(analysis.normalizedText, previous);
    const intent = followUp && rawIntent.intent === 'unknown'
      ? { ...rawIntent, intent: followUp, confidence: Math.max(0.42, rawIntent.confidence), shouldClarify: false, source: 'hybrid' as const }
      : rawIntent;
    const emotion = estimateEmotion(analysis.normalizedText, language, this.config.enableEmotionCues);
    const safety = detectSafetySignals(analysis.normalizedText);
    const entities = this.config.enableEntityExtraction ? extractEntities(analysis.normalizedText, language) : [];
    const safetyResponse = createSafetyResponse(safety, language);

    let responseText: string;
    let actions;
    let shouldClarify = intent.shouldClarify;
    if (safetyResponse) {
      responseText = safetyResponse.response;
      actions = safetyResponse.actions.map((id, index) => ({ id, label: actionLabel(id, language), priority: index + 1 }));
      shouldClarify = safety.level === 'high';
    } else {
      const plan = planResponse(intent.intent, language, intent.shouldClarify);
      responseText = plan.text;
      actions = plan.actions;
    }

    if (this.config.retainConversationState) {
      this.context.update({
        conversationId,
        intent: safety.level === 'high' || safety.level === 'imminent' ? 'safety_concern' : intent.intent,
        emotion: emotion.label,
        topics: entities.filter((entity) => entity.type === 'topic').map((entity) => entity.value),
        language,
        safety: safety.level,
      });
    }

    return {
      text: responseText,
      language,
      intent,
      emotion,
      safety,
      entities,
      actions,
      confidence: intent.confidence,
      shouldClarify,
      disclaimer: getSafetyDisclaimer(language),
      telemetry: {
        processingMs: Math.max(0, now() - start),
        inputChars: Math.min(String(request.text ?? '').length, this.config.maxInputChars),
        pipelineVersion: PIPELINE_VERSION,
        remoteModelUsed: false,
      },
    };
  }

  /** Clear derived in-memory context. No raw user messages have been persisted by this class. */
  forget(conversationId?: string): void { this.context.clear(conversationId); }

  configuration(): NlpConfig { return { ...this.config, supportedLanguages: [...this.config.supportedLanguages] }; }
}

function actionLabel(id: 'stop' | 'grounding' | 'contact_support', language: string): string {
  if (language === 'fr') return id === 'stop' ? 'Arrêter' : id === 'grounding' ? 'Ancrage' : 'Soutien humain';
  if (language === 'es') return id === 'stop' ? 'Detener' : id === 'grounding' ? 'Orientación al presente' : 'Apoyo humano';
  return id === 'stop' ? 'Stop' : id === 'grounding' ? 'Grounding' : 'Contact support';
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

export function createLocalNlpAssistant(options?: LocalNlpAssistantOptions): LocalNlpAssistant {
  return new LocalNlpAssistant(options);
}
