import type { Language, NlpConfig } from './types.ts';

/** Safe defaults: no network model, no raw-text persistence, bounded input. */
export const DEFAULT_NLP_CONFIG: Readonly<NlpConfig> = Object.freeze({
  maxInputChars: 4000,
  maxTokens: 600,
  minIntentConfidence: 0.36,
  minIntentMargin: 0.08,
  enableEmotionCues: true,
  enableEntityExtraction: true,
  retainConversationState: true,
  supportedLanguages: ['en', 'fr', 'es', 'unknown'] as Language[],
});

export const PIPELINE_VERSION = '1.0.0-local';

export function resolveConfig(overrides: Partial<NlpConfig> = {}): NlpConfig {
  const merged = { ...DEFAULT_NLP_CONFIG, ...overrides };
  merged.maxInputChars = clampInteger(merged.maxInputChars, 100, 12000, 4000);
  merged.maxTokens = clampInteger(merged.maxTokens, 20, 2000, 600);
  merged.minIntentConfidence = clamp(merged.minIntentConfidence, 0.1, 0.95, 0.36);
  merged.minIntentMargin = clamp(merged.minIntentMargin, 0, 0.5, 0.08);
  merged.supportedLanguages = Array.isArray(merged.supportedLanguages)
    ? [...new Set(merged.supportedLanguages)]
    : [...DEFAULT_NLP_CONFIG.supportedLanguages];
  return merged;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  return Math.round(clamp(value, min, max, fallback));
}
