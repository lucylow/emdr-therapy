/** Public contracts for the advanced dialogue layer. No clinical claims are encoded here. */
export type Locale = 'en' | 'fr' | 'es';
export type Intent =
  | 'app_help' | 'emdr_definition' | 'grounding' | 'breathing' | 'session_setup'
  | 'adjust_speed' | 'adjust_duration' | 'adjust_audio' | 'adjust_visual'
  | 'pause' | 'resume' | 'stop' | 'safety_support' | 'privacy' | 'feedback'
  | 'greeting' | 'farewell' | 'clarify' | 'unknown';
export type RiskSignal = 'none' | 'urgent_support_request' | 'self_harm_language' | 'immediate_danger_language';
export type TrustLevel = 'local-reviewed' | 'remote-unverified';
export type Source = { id: string; title: string; locale: Locale; snippet?: string; trust: TrustLevel };
export type IntentCandidate = { intent: Intent; score: number; evidence: string[] };
export type ExtractedEntity = { kind: 'duration' | 'speed' | 'volume' | 'feature' | 'language'; value: string | number; unit?: string; span?: [number, number] };
export type UserPreferences = { locale?: Locale; tone?: 'warm' | 'neutral' | 'concise'; confirmedFeatures?: string[]; reducedMotion?: boolean; audioEnabled?: boolean };
export type TurnConsent = { remoteProcessing: boolean; sendHistory: boolean; storeTranscript: boolean };
export type ChatMessage = { role: 'user' | 'assistant' | 'system'; text: string; createdAt?: number; source?: 'local' | 'remote'; metadata?: Record<string, unknown> };
export type ActionSuggestion = { id: string; label: string; requiresConfirmation: boolean; parameters?: Record<string, string | number | boolean> };
export type ChatResponse = {
  text: string; locale: Locale; intent: Intent; confidence: number; sources: Source[];
  suggestions: ActionSuggestion[]; followUp?: string; safetySignal: RiskSignal;
  mode: 'local-template' | 'local-retrieval' | 'remote-reviewed' | 'safe-fallback';
  explanation: string[]; turnId: string;
};
export type TurnInput = {
  text: string; conversationId: string; locale?: Locale; preferences?: UserPreferences;
  consent?: Partial<TurnConsent>; localOnly?: boolean; now?: number;
};
export type KnowledgeArticle = {
  id: string; locale: Locale; title: string; body: string; tags: string[]; intent?: Intent;
  reviewed: boolean; version: number; updatedAt: string; caution?: string;
};
export type ModelRequest = { system: string; user: string; context: Array<{ role: 'user' | 'assistant'; content: string }>; locale: Locale; maxOutputTokens: number };
export type ModelResult = { text: string; provider: string; latencyMs?: number };
export interface ChatModelProvider { generate(request: ModelRequest, signal?: AbortSignal): Promise<ModelResult>; }
export type DialogueSlot = { name: string; value: string | number | boolean; confirmed: boolean; updatedAt: number };
export type PendingQuestion = { id: string; kind: 'confirm-preference' | 'choose-option' | 'clarify-intent'; prompt: string; options: string[]; createdAt: number; expiresAt: number };
export type DialogueSnapshot = { conversationId: string; turnCount: number; lastIntent?: Intent; lastPrompt?: string; slots: DialogueSlot[]; pending?: PendingQuestion; preference: UserPreferences; updatedAt: number };
export type EvaluationCase = { name: string; input: string; expectedIntent?: Intent; expectedSafety?: RiskSignal; localOnly?: boolean };
