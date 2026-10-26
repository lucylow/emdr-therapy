import type { Locale, UserPreferences } from './types.ts';

export type AdvancedChatbotConfig = {
  defaultLocale: Locale;
  maxInputChars: number;
  maxOutputChars: number;
  maxContextMessages: number;
  maxContextChars: number;
  remoteEnabled: boolean;
  requestTimeoutMs: number;
  maxRequestsPerMinute: number;
  cacheEntries: number;
  minimumRetrievalScore: number;
  retrievalScoreMargin: number;
  requireReviewedKnowledge: boolean;
  sessionTtlMs: number;
  pendingConfirmationTtlMs: number;
  storeRawTranscripts: boolean;
};

export const DEFAULT_ADVANCED_CONFIG: Readonly<AdvancedChatbotConfig> = Object.freeze({
  defaultLocale: 'en', maxInputChars: 4000, maxOutputChars: 1800,
  maxContextMessages: 8, maxContextChars: 6000, remoteEnabled: false,
  requestTimeoutMs: 8000, maxRequestsPerMinute: 20, cacheEntries: 128,
  minimumRetrievalScore: 0.16, retrievalScoreMargin: 0.035,
  requireReviewedKnowledge: true, sessionTtlMs: 30 * 60_000,
  pendingConfirmationTtlMs: 90_000, storeRawTranscripts: false,
});

export function validateConfig(input: Partial<AdvancedChatbotConfig> = {}): AdvancedChatbotConfig {
  const out = { ...DEFAULT_ADVANCED_CONFIG, ...input };
  const integerBounds: Array<[keyof AdvancedChatbotConfig, number, number]> = [
    ['maxInputChars', 1, 20_000], ['maxOutputChars', 32, 12_000],
    ['maxContextMessages', 0, 100], ['maxContextChars', 0, 50_000],
    ['requestTimeoutMs', 100, 120_000], ['maxRequestsPerMinute', 1, 1000],
    ['cacheEntries', 0, 10_000], ['sessionTtlMs', 1000, 24 * 60 * 60_000],
    ['pendingConfirmationTtlMs', 1000, 10 * 60_000],
  ];
  for (const [key, min, max] of integerBounds) {
    const value = out[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${String(key)} must be an integer between ${min} and ${max}`);
    }
  }
  if (out.minimumRetrievalScore < 0 || out.minimumRetrievalScore > 1) throw new RangeError('minimumRetrievalScore must be in [0,1]');
  if (out.retrievalScoreMargin < 0 || out.retrievalScoreMargin > 1) throw new RangeError('retrievalScoreMargin must be in [0,1]');
  if (!(['en', 'fr', 'es'] as const).includes(out.defaultLocale)) throw new RangeError('Unsupported defaultLocale');
  return out;
}

export function sanitizePreferences(input?: UserPreferences): UserPreferences {
  if (!input) return {};
  const output: UserPreferences = {};
  if (input.locale && ['en', 'fr', 'es'].includes(input.locale)) output.locale = input.locale;
  if (input.tone && ['warm', 'neutral', 'concise'].includes(input.tone)) output.tone = input.tone;
  if (typeof input.reducedMotion === 'boolean') output.reducedMotion = input.reducedMotion;
  if (typeof input.audioEnabled === 'boolean') output.audioEnabled = input.audioEnabled;
  if (Array.isArray(input.confirmedFeatures)) {
    output.confirmedFeatures = [...new Set(input.confirmedFeatures.filter(x => typeof x === 'string' && /^[a-z0-9_-]{1,40}$/i.test(x)))].slice(0, 20);
  }
  return output;
}
