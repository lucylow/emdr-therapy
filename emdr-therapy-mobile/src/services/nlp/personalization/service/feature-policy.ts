import type { ProfileSettings } from '../core/types.ts';

export type FeatureName = 'profile' | 'insights' | 'reflection-theme-extraction' | 'usage-learning' | 'personalized-recommendations' | 'data-export';
export interface FeatureDecision { readonly allowed: boolean; readonly reason?: string; }

export function decideFeature(feature: FeatureName, settings: ProfileSettings, explicitConsent: boolean): FeatureDecision {
  switch (feature) {
    case 'profile':
      return settings.personalizationEnabled ? { allowed: true } : { allowed: false, reason: 'personalization-disabled' };
    case 'insights':
      return settings.personalizationEnabled && settings.insightsEnabled && explicitConsent
        ? { allowed: true } : { allowed: false, reason: 'insights-consent-required' };
    case 'reflection-theme-extraction':
      return settings.personalizationEnabled && settings.reflectionThemesEnabled && explicitConsent
        ? { allowed: true } : { allowed: false, reason: 'reflection-consent-required' };
    case 'usage-learning':
      return settings.personalizationEnabled && settings.usageLearningEnabled && explicitConsent
        ? { allowed: true } : { allowed: false, reason: 'learning-consent-required' };
    case 'personalized-recommendations':
      return settings.personalizationEnabled && settings.usageLearningEnabled && explicitConsent
        ? { allowed: true } : { allowed: false, reason: 'learning-consent-required' };
    case 'data-export':
      return { allowed: true }; // exporting local data is a user action, not AI profiling.
  }
}

export function shouldDeleteInferredPreferences(settings: ProfileSettings, learningWasRevoked: boolean): boolean {
  return !settings.personalizationEnabled || learningWasRevoked;
}

export function canProcessReflection(settings: ProfileSettings, explicitConsent: boolean): boolean {
  return settings.personalizationEnabled && settings.reflectionThemesEnabled && explicitConsent;
}
