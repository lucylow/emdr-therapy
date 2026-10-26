/** Public contracts shared by the local NLP pipeline. Keep these non-clinical. */
export type Language = 'en' | 'fr' | 'es' | 'unknown';

export type Intent =
  | 'greeting'
  | 'goodbye'
  | 'grounding_request'
  | 'breathing_request'
  | 'explain_app'
  | 'configure_stimulation'
  | 'session_ready'
  | 'pause_request'
  | 'stop_request'
  | 'distress_share'
  | 'positive_share'
  | 'reflection_request'
  | 'privacy_question'
  | 'professional_support_request'
  | 'safety_concern'
  | 'feedback'
  | 'unknown';

export type EmotionLabel =
  | 'anxious'
  | 'overwhelmed'
  | 'sad'
  | 'angry'
  | 'lonely'
  | 'calm'
  | 'hopeful'
  | 'positive'
  | 'mixed'
  | 'neutral';

export type RiskLevel = 'none' | 'possible' | 'high' | 'imminent';
export type SafetyCategory =
  | 'self_harm'
  | 'suicide'
  | 'harm_to_others'
  | 'medical_emergency'
  | 'overdose'
  | 'abuse_or_immediate_danger'
  | 'distress'
  | 'none';

export interface TextAnalysis {
  language: Language;
  normalizedText: string;
  tokens: string[];
  sentenceCount: number;
  wasTruncated: boolean;
  redactions: number;
}

export interface IntentResult {
  intent: Intent;
  confidence: number;
  margin: number;
  source: 'rules' | 'hybrid' | 'fallback';
  alternatives: Array<{ intent: Intent; score: number }>;
  shouldClarify: boolean;
}

export interface EmotionResult {
  label: EmotionLabel;
  confidence: number;
  scores: Record<EmotionLabel, number>;
  cues: string[];
  /** Always true: labels describe word cues, not the person's mental health. */
  isNonClinicalEstimate: true;
}

export interface SafetyResult {
  level: RiskLevel;
  category: SafetyCategory;
  confidence: number;
  needsImmediateSupport: boolean;
  matchedSignals: string[];
  quotedOrHypothetical: boolean;
  explanationCode:
    | 'no_signal'
    | 'distress_language'
    | 'possible_safety_signal'
    | 'explicit_safety_signal'
    | 'immediate_danger_signal';
}

export interface ExtractedEntity {
  type: 'topic' | 'time' | 'sensory_preference' | 'support_preference';
  value: string;
  confidence: number;
  sourcePhrase: string;
}

export interface ConversationState {
  turnCount: number;
  previousIntent?: Intent;
  previousEmotion?: EmotionLabel;
  recentTopics: string[];
  language: Language;
  lastSafetyLevel: RiskLevel;
  /** Incremented on every user turn; raw messages are deliberately not retained. */
  revision: number;
}

export interface NlpRequest {
  text: string;
  conversationId?: string;
  enableRemoteModel?: boolean;
  userConsentedToRemoteProcessing?: boolean;
  maxOutputChars?: number;
}

export interface SuggestedAction {
  id: 'pause' | 'stop' | 'grounding' | 'breathing' | 'contact_support' | 'privacy_info' | 'clarify';
  label: string;
  priority: number;
}

export interface NlpResponse {
  text: string;
  language: Language;
  intent: IntentResult;
  emotion: EmotionResult;
  safety: SafetyResult;
  entities: ExtractedEntity[];
  actions: SuggestedAction[];
  confidence: number;
  shouldClarify: boolean;
  disclaimer?: string;
  /** User text is intentionally omitted from this object. */
  telemetry: {
    processingMs: number;
    inputChars: number;
    pipelineVersion: string;
    remoteModelUsed: false;
  };
}

export interface NlpConfig {
  maxInputChars: number;
  maxTokens: number;
  minIntentConfidence: number;
  minIntentMargin: number;
  enableEmotionCues: boolean;
  enableEntityExtraction: boolean;
  retainConversationState: boolean;
  supportedLanguages: Language[];
}
