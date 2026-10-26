import type { ActivityRecommendation, LanguageCode, SupportToolId } from '../core/types.ts';
import { getActivityDefinition } from './catalog.ts';

export interface LocalizedRecommendation {
  readonly activityId: SupportToolId;
  readonly title: string;
  readonly summary: string;
  readonly whyShown: readonly string[];
  readonly caution: string;
  readonly actionLabel: string;
  readonly autoLaunch: false;
}

const REASON_COPY: Record<string, Record<LanguageCode, string>> = {
  'matches a preference you chose or confirmed': {
    en: 'Matches a preference you chose or confirmed', fr: 'Correspond à une préférence choisie ou confirmée', es: 'Coincide con una preferencia elegida o confirmada',
  },
  'based on your optional feedback': {
    en: 'Uses your optional feedback', fr: 'Tient compte de vos commentaires facultatifs', es: 'Tiene en cuenta tus comentarios opcionales',
  },
  'a general option to explore': {
    en: 'A general option you can explore', fr: 'Une option générale à explorer', es: 'Una opción general que puedes explorar',
  },
  'fits a topic you selected': {
    en: 'Fits a topic you selected', fr: 'Correspond à un sujet sélectionné', es: 'Coincide con un tema que seleccionaste',
  },
  'does not require animated movement': {
    en: 'Does not require animated movement', fr: 'Ne nécessite pas de mouvement animé', es: 'No requiere movimiento animado',
  },
};

const ACTION_LABEL: Record<LanguageCode, string> = {
  en: 'Choose this option', fr: 'Choisir cette option', es: 'Elegir esta opción',
};

export function explainRecommendation(item: ActivityRecommendation, language: LanguageCode): LocalizedRecommendation | undefined {
  const definition = getActivityDefinition(item.activityId);
  if (!definition) return undefined;
  const reasons = item.reasons.map((reason) => REASON_COPY[reason]?.[language]).filter((value): value is string => !!value);
  return {
    activityId: item.activityId,
    title: definition.title[language],
    summary: definition.summary[language],
    whyShown: reasons,
    caution: definition.safetyNote,
    actionLabel: ACTION_LABEL[language],
    autoLaunch: false,
  };
}

export function explainRankingPolicy(language: LanguageCode): string {
  const text: Record<LanguageCode, string> = {
    en: 'Suggestions are optional. Your confirmed preferences and explicit feedback can affect ordering. No suggestion starts an activity or changes stimulation settings automatically.',
    fr: 'Les suggestions sont facultatives. Vos préférences confirmées et vos commentaires explicites peuvent modifier leur ordre. Aucune suggestion ne lance une activité ni ne modifie automatiquement la stimulation.',
    es: 'Las sugerencias son opcionales. Tus preferencias confirmadas y comentarios explícitos pueden cambiar el orden. Ninguna sugerencia inicia una actividad ni cambia automáticamente la estimulación.',
  };
  return text[language];
}
