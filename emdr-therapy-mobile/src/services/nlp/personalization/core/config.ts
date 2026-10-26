import type { ProfileSettings } from './types.ts';

/** Product-level guardrails. These values intentionally favor conservative output. */
export const PERSONALIZATION_LIMITS = Object.freeze({
  minInsightSamples: 5,
  minTrendSamplesPerWindow: 3,
  maxCheckIns: 730,
  maxFeedbackRecords: 1000,
  maxEvents: 500,
  maxThemesPerReflection: 4,
  maxReflectionCharacters: 6000,
  maxTokensPerReflection: 1200,
  maxProposalLifetimeDays: 21,
  maxPreferenceConfidence: 0.94,
  minPreferenceConfidence: 0.45,
  minObservedEvidence: 4,
  minRecommendationEvidence: 3,
  maxRecommendations: 3,
  maxInsightCards: 5,
  defaultRetentionDays: 180,
  minimumRetentionDays: 7,
  maximumRetentionDays: 730,
  maxDateSkewHours: 24,
  maxInsightAgeDays: 120,
  maxThemeLabelLength: 48,
  maxThemeCount: 10000,
  maxScore: 100,
  minRating: 0,
  maxRating: 10,
});

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = Object.freeze({
  personalizationEnabled: true,
  insightsEnabled: false,
  reflectionThemesEnabled: false,
  usageLearningEnabled: false,
  retentionDays: PERSONALIZATION_LIMITS.defaultRetentionDays,
  language: 'en',
});

export const INSIGHT_LIMITATIONS = Object.freeze([
  'These are summaries of entries you chose to record, not a mental-health assessment.',
  'Patterns in logs do not establish causes or predict what will happen next.',
  'A small or incomplete sample can hide important context.',
]);

export const PERSONALIZATION_POLICIES = Object.freeze({
  explicitPreferenceWins: true,
  inferredPreferencesRequireConfirmation: true,
  inferredClinicalTraitsAllowed: false,
  storeRawJournalText: false,
  remoteProcessingDefault: false,
  autoStartActivity: false,
  autoChangeStimulationSettings: false,
  safetyControlUsesNlp: false,
  inferProtectedCharacteristics: false,
  trainAcrossUsersByDefault: false,
});

export function normalizeSettings(input: Partial<ProfileSettings>): ProfileSettings {
  const days = typeof input.retentionDays === 'number' && Number.isFinite(input.retentionDays)
    ? Math.round(input.retentionDays)
    : DEFAULT_PROFILE_SETTINGS.retentionDays;
  return {
    personalizationEnabled: input.personalizationEnabled ?? DEFAULT_PROFILE_SETTINGS.personalizationEnabled,
    insightsEnabled: input.insightsEnabled ?? DEFAULT_PROFILE_SETTINGS.insightsEnabled,
    reflectionThemesEnabled: input.reflectionThemesEnabled ?? DEFAULT_PROFILE_SETTINGS.reflectionThemesEnabled,
    usageLearningEnabled: input.usageLearningEnabled ?? DEFAULT_PROFILE_SETTINGS.usageLearningEnabled,
    retentionDays: Math.max(PERSONALIZATION_LIMITS.minimumRetentionDays,
      Math.min(PERSONALIZATION_LIMITS.maximumRetentionDays, days)),
    language: input.language === 'fr' || input.language === 'es' ? input.language : 'en',
  };
}

export function insightsAvailable(settings: ProfileSettings, consent: boolean): boolean {
  return settings.insightsEnabled && consent;
}

export function learningAvailable(settings: ProfileSettings, consent: boolean): boolean {
  return settings.personalizationEnabled && settings.usageLearningEnabled && consent;
}
