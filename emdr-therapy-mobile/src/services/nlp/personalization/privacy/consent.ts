import type { PersonalizationConsent, ProfileSettings } from '../core/types.ts';

export type ConsentArea = 'personalization' | 'aggregateInsights' | 'reflectionThemeExtraction' | 'usageLearning';

export function createDefaultConsent(now = new Date()): PersonalizationConsent {
  return { personalization: true, aggregateInsights: false, reflectionThemeExtraction: false, usageLearning: false, updatedAt: now.toISOString() };
}

export function normalizeConsent(input: Partial<PersonalizationConsent>, now = new Date()): PersonalizationConsent {
  const personalization = input.personalization ?? false;
  return {
    personalization,
    aggregateInsights: personalization && (input.aggregateInsights ?? false),
    reflectionThemeExtraction: personalization && (input.reflectionThemeExtraction ?? false),
    usageLearning: personalization && (input.usageLearning ?? false),
    updatedAt: now.toISOString(),
  };
}

export function updateConsent(current: PersonalizationConsent, area: ConsentArea, value: boolean, now = new Date()): PersonalizationConsent {
  return normalizeConsent({ ...current, [area]: value }, now);
}

export function consentFromSettings(settings: ProfileSettings): PersonalizationConsent {
  return {
    personalization: settings.personalizationEnabled,
    aggregateInsights: settings.insightsEnabled,
    reflectionThemeExtraction: settings.reflectionThemesEnabled,
    usageLearning: settings.usageLearningEnabled,
    updatedAt: new Date().toISOString(),
  };
}

export function consentRevocationEffects(previous: PersonalizationConsent, next: PersonalizationConsent): readonly string[] {
  const actions: string[] = [];
  if (previous.personalization && !next.personalization) actions.push('clear-inferred-and-accepted-preferences');
  if (previous.aggregateInsights && !next.aggregateInsights) actions.push('exclude-future-checkins-from-aggregate-insights');
  if (previous.reflectionThemeExtraction && !next.reflectionThemeExtraction) actions.push('disable-reflection-theme-extraction');
  if (previous.usageLearning && !next.usageLearning) actions.push('stop-usage-learning');
  return actions;
}
