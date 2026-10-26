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
    const bodyInterpretationQuestion = isBodyInterpretationQuestion(analysis.normalizedText, language);
    const followUp = resolveFollowUp(analysis.normalizedText, previous);
    const intent = bodyInterpretationQuestion
      ? { ...rawIntent, intent: 'unknown' as const, shouldClarify: true }
      : followUp && rawIntent.intent === 'unknown'
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
    } else if (bodyInterpretationQuestion) {
      responseText = bodyInterpretationResponse(language);
      actions = [
        { id: 'grounding' as const, label: actionLabel('grounding', language), priority: 1 },
        { id: 'contact_support' as const, label: actionLabel('contact_support', language), priority: 2 },
      ];
      shouldClarify = true;
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

function isBodyInterpretationQuestion(text: string, language: string): boolean {
  if (language === 'fr') {
    return /\b(?:corps|poitrine|cœur|coeur|ventre|respir\w*|douleur|fourmillement|engourdi\w*|vertige)\b/u.test(text)
      && /\b(?:pourquoi|signifi\w*|veut dire|cause|causé par)\b/u.test(text);
  }
  if (language === 'es') {
    return /\b(?:cuerpo|pecho|corazón|corazon|estómago|estomago|respir\w*|dolor|hormigueo|entumec\w*|mareo)\b/u.test(text)
      && /\b(?:por qué|signific\w*|quiere decir|causa|causado por)\b/u.test(text);
  }
  return /\b(?:body|chest|heart|stomach|breath\w*|pain|tingling|numb\w*|dizz\w*|tightness|sensation)\b/u.test(text)
    && /\b(?:what|why|mean\w*|meaning|cause\w*|because|interpret\w*)\b/u.test(text);
}

function bodyInterpretationResponse(language: string): string {
  if (language === 'fr') return "Je ne peux pas déterminer ce qu'une sensation corporelle signifie ni en connaître la cause, et je ne veux pas deviner. Préférez-vous un soutien neutre pour vous orienter dans le présent, ou en parler à un professionnel qualifié ? En cas d'urgence médicale, contactez les services d'urgence locaux.";
  if (language === 'es') return "No puedo determinar qué significa una sensación corporal ni su causa, y no quiero adivinar. ¿Prefieres apoyo neutral para orientarte en el presente o hablarlo con un profesional cualificado? Si podría ser una urgencia médica, contacta con los servicios de emergencia locales.";
  return "I can’t determine what a body sensation means or what caused it, and I don’t want to guess. Would you prefer neutral present-moment support or to discuss it with a qualified professional? If this could be a medical emergency, contact local emergency services.";
}

export function createLocalNlpAssistant(options?: LocalNlpAssistantOptions): LocalNlpAssistant {
  return new LocalNlpAssistant(options);
}
