import type { LanguageCode, PreferenceEntry, PreferenceKey, PreferenceValue, ProfileSnapshot } from '../core/types.ts';
import { createDefaultProfile } from '../profile/defaults.ts';
import { validatePreferenceValue } from '../core/validation.ts';

export interface OnboardingChoice {
  readonly key: PreferenceKey;
  readonly value: PreferenceValue;
}

export interface OnboardingInput {
  readonly profileId: string;
  readonly language: LanguageCode;
  readonly choices: readonly OnboardingChoice[];
  readonly personalization: boolean;
  readonly insights: boolean;
  readonly learning: boolean;
  readonly themeExtraction: boolean;
}

/** One-time initializer; no preference is inferred from the first message. */
export function createOnboardingProfile(input: OnboardingInput, now = new Date()): ProfileSnapshot {
  const base = createDefaultProfile(input.profileId, now);
  const preferences: Partial<Record<PreferenceKey, PreferenceEntry>> = {};
  for (const choice of input.choices.slice(0, 12)) {
    if (!validatePreferenceValue(choice.key, choice.value)) continue;
    const timestamp = now.toISOString();
    preferences[choice.key] = {
      key: choice.key, value: Array.isArray(choice.value) ? [...choice.value] : choice.value,
      origin: 'explicit', status: 'active', confidence: 1, evidenceCount: 1,
      firstSeenAt: timestamp, lastSeenAt: timestamp, userConfirmedAt: timestamp,
      explanationCode: 'explicit-onboarding-choice', revision: 1,
    };
  }
  return {
    ...base,
    preferences,
    settings: {
      ...base.settings,
      language: input.language,
      personalizationEnabled: input.personalization,
      insightsEnabled: input.insights,
      usageLearningEnabled: input.learning && input.personalization,
      reflectionThemesEnabled: input.themeExtraction && input.personalization,
    },
  };
}

export function defaultOnboardingCopy(language: LanguageCode): readonly string[] {
  const copy: Record<LanguageCode, readonly string[]> = {
    en: [
      'Personalization is optional and can be changed or cleared at any time.',
      'Insights summarize only check-ins you choose to include.',
      'Journal text is not saved by theme extraction; review themes before saving them.',
      'Suggestions never start a session or change stimulation settings.',
    ],
    fr: [
      'La personnalisation est facultative et peut être modifiée ou supprimée à tout moment.',
      'Les aperçus résument uniquement les bilans que vous choisissez d’inclure.',
      'L’extraction des thèmes ne conserve pas le texte du journal; vérifiez les thèmes avant de les enregistrer.',
      'Les suggestions ne lancent jamais de séance et ne modifient pas les réglages de stimulation.',
    ],
    es: [
      'La personalización es opcional y se puede cambiar o borrar en cualquier moment.',
      'Los resúmenes incluyen solo los registros que eliges incluir.',
      'La extracción de temas no guarda el texto del diario; revisa los temas antes de guardarlos.',
      'Las sugerencias nunca inician una sesión ni cambian los ajustes de estimulación.',
    ],
  };
  return copy[language];
}
