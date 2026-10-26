import type { ChatbotConfig } from './types.ts';

export const CHATBOT_VERSION = '2.0.0-local-first';

export const DEFAULT_CHATBOT_CONFIG: Readonly<ChatbotConfig> = Object.freeze({
  maxInputChars: 2400,
  maxOutputChars: 3600,
  maxHistoryTurns: 4,
  maxHistoryChars: 2400,
  conversationTtlMs: 20 * 60 * 1000,
  maxConversations: 32,
  remoteTimeoutMs: 9000,
  maxOutputTokens: 480,
  temperature: 0.35,
  minimumIntentConfidence: 0.49,
  minimumIntentMargin: 0.08,
  allowRemoteModel: false,
});

export function resolveChatbotConfig(partial: Partial<ChatbotConfig> = {}): ChatbotConfig {
  const raw = { ...DEFAULT_CHATBOT_CONFIG, ...partial };
  return {
    maxInputChars: intInRange(raw.maxInputChars, 1, 10000, DEFAULT_CHATBOT_CONFIG.maxInputChars),
    maxOutputChars: intInRange(raw.maxOutputChars, 80, 20000, DEFAULT_CHATBOT_CONFIG.maxOutputChars),
    maxHistoryTurns: intInRange(raw.maxHistoryTurns, 0, 20, DEFAULT_CHATBOT_CONFIG.maxHistoryTurns),
    maxHistoryChars: intInRange(raw.maxHistoryChars, 0, 20000, DEFAULT_CHATBOT_CONFIG.maxHistoryChars),
    conversationTtlMs: intInRange(raw.conversationTtlMs, 1000, 24 * 60 * 60 * 1000, DEFAULT_CHATBOT_CONFIG.conversationTtlMs),
    maxConversations: intInRange(raw.maxConversations, 1, 500, DEFAULT_CHATBOT_CONFIG.maxConversations),
    remoteTimeoutMs: intInRange(raw.remoteTimeoutMs, 250, 120000, DEFAULT_CHATBOT_CONFIG.remoteTimeoutMs),
    maxOutputTokens: intInRange(raw.maxOutputTokens, 64, 4096, DEFAULT_CHATBOT_CONFIG.maxOutputTokens),
    temperature: Number.isFinite(raw.temperature) ? Math.max(0, Math.min(1, raw.temperature)) : DEFAULT_CHATBOT_CONFIG.temperature,
    minimumIntentConfidence: Number.isFinite(raw.minimumIntentConfidence) ? Math.max(0, Math.min(1, raw.minimumIntentConfidence)) : DEFAULT_CHATBOT_CONFIG.minimumIntentConfidence,
    minimumIntentMargin: Number.isFinite(raw.minimumIntentMargin) ? Math.max(0, Math.min(1, raw.minimumIntentMargin)) : DEFAULT_CHATBOT_CONFIG.minimumIntentMargin,
    // Remote generation is off by default and remains gated by per-request consent.
    allowRemoteModel: raw.allowRemoteModel === true,
  };
}

function intInRange(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.round(Math.max(min, Math.min(max, value)));
}
