import type { ProfileSnapshot, PreferenceKey } from '../core/types.ts';
import { toIso } from '../core/time.ts';

export interface RevocationOutcome {
  readonly profile: ProfileSnapshot;
  readonly disabledFeatures: readonly string[];
  readonly clearedPreferences: readonly PreferenceKey[];
  readonly retainedExplicitPreferenceCount: number;
}

/** Revoke future optional processing while retaining explicit UI preferences and user-entered logs. */
export function revokeOptionalPersonalization(profile: ProfileSnapshot, scopes: {
  readonly all: boolean;
  readonly insights?: boolean;
  readonly themeExtraction?: boolean;
  readonly usageLearning?: boolean;
}, now = new Date()): RevocationOutcome {
  const preferences = { ...profile.preferences };
  const clearedPreferences: PreferenceKey[] = [];
  if (scopes.all) {
    for (const key of Object.keys(preferences) as PreferenceKey[]) {
      const entry = preferences[key];
      if (entry && entry.origin !== 'explicit') { delete preferences[key]; clearedPreferences.push(key); }
    }
  }
  if (scopes.usageLearning || scopes.all) {
    const entry = preferences.preferredSupportTools;
    if (entry && entry.origin !== 'explicit') { delete preferences.preferredSupportTools; clearedPreferences.push('preferredSupportTools'); }
  }
  const settings = {
    ...profile.settings,
    personalizationEnabled: scopes.all ? false : profile.settings.personalizationEnabled,
    insightsEnabled: scopes.all || scopes.insights ? false : profile.settings.insightsEnabled,
    reflectionThemesEnabled: scopes.all || scopes.themeExtraction ? false : profile.settings.reflectionThemesEnabled,
    usageLearningEnabled: scopes.all || scopes.usageLearning ? false : profile.settings.usageLearningEnabled,
  };
  const next: ProfileSnapshot = { ...profile, updatedAt: toIso(now), preferences, settings };
  const retainedExplicitPreferenceCount = Object.values(preferences).filter((entry) => entry?.origin === 'explicit' && entry.status === 'active').length;
  const disabledFeatures = [
    ...(scopes.all ? ['personalization'] : []),
    ...(scopes.all || scopes.insights ? ['aggregate-insights'] : []),
    ...(scopes.all || scopes.themeExtraction ? ['reflection-theme-extraction'] : []),
    ...(scopes.all || scopes.usageLearning ? ['usage-learning'] : []),
  ];
  return { profile: next, disabledFeatures, clearedPreferences: [...new Set(clearedPreferences)], retainedExplicitPreferenceCount };
}
