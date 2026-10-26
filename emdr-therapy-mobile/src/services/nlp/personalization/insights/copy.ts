import type { LanguageCode, ThemeId } from '../core/types.ts';

const NUMBER_FORMAT: Record<LanguageCode, string> = { en: 'en-CA', fr: 'fr-CA', es: 'es-ES' };
export function formatNumber(value: number, language: LanguageCode, digits = 1): string {
  return new Intl.NumberFormat(NUMBER_FORMAT[language], { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

const THEME_LABELS: Record<ThemeId, Record<LanguageCode, string>> = {
  'daily-routines': { en: 'daily routines', fr: 'routines quotidiennes', es: 'rutinas diarias' },
  'sleep-and-energy': { en: 'sleep and energy', fr: 'sommeil et énergie', es: 'sueño y energía' },
  'relationships-and-connection': { en: 'relationships and connection', fr: 'relations et liens', es: 'relaciones y conexión' },
  'work-and-demands': { en: 'work and demands', fr: 'travail et exigences', es: 'trabajo y exigencias' },
  'uncertainty-and-change': { en: 'uncertainty and change', fr: 'incertitude et changement', es: 'incertidumbre y cambio' },
  'self-compassion': { en: 'self-compassion', fr: 'bienveillance envers soi', es: 'autocompasión' },
  'body-and-senses': { en: 'body and senses', fr: 'corps et sensations', es: 'cuerpo y sentidos' },
  'nature-and-outdoors': { en: 'nature and outdoors', fr: 'nature et plein air', es: 'naturaleza y aire libre' },
  'creative-activities': { en: 'creative activities', fr: 'activités créatives', es: 'actividades creativas' },
  'movement-and-rest': { en: 'movement and rest', fr: 'mouvement et repos', es: 'movimiento y descanso' },
  other: { en: 'other topics', fr: 'autres sujets', es: 'otros temas' },
};
export function themeLabel(theme: ThemeId, language: LanguageCode): string { return THEME_LABELS[theme][language]; }

export function buildTrendNarrative(input: {
  readonly count: number;
  readonly days: number;
  readonly currentMean?: number;
  readonly previousMean?: number;
  readonly language: LanguageCode;
}): string {
  const { count, days, currentMean, previousMean, language } = input;
  if (language === 'fr') {
    if (currentMean === undefined || previousMean === undefined || Math.abs(currentMean - previousMean) < 0.5) {
      return `Sur ${count} bilans que vous avez choisi d’inclure, la moyenne récente était ${formatNumber(currentMean ?? 0, language)} sur 10. Les données ne montrent pas de différence nette entre les deux périodes, ou la comparaison est incomplète.`;
    }
    const delta = currentMean - previousMean;
    return `La moyenne de vos bilans récents était de ${formatNumber(currentMean, language)} sur 10, contre ${formatNumber(previousMean, language)} pour la période précédente, soit une différence de ${formatNumber(Math.abs(delta), language)} point(s). Cela décrit vos entrées et n’en explique pas la cause.`;
  }
  if (language === 'es') {
    if (currentMean === undefined || previousMean === undefined || Math.abs(currentMean - previousMean) < 0.5) {
      return `En ${count} registros que decidiste incluir, el promedio reciente fue ${formatNumber(currentMean ?? 0, language)} de 10. Los datos no muestran una diferencia clara entre los dos periodos, o la comparación está incompleta.`;
    }
    return `El promedio de tus registros recientes fue ${formatNumber(currentMean, language)} de 10, frente a ${formatNumber(previousMean, language)} en el periodo anterior, una diferencia de ${formatNumber(Math.abs(currentMean - previousMean), language)} punto(s). Esto describe tus registros, no explica la causa.`;
  }
  if (currentMean === undefined || previousMean === undefined || Math.abs(currentMean - previousMean) < 0.5) {
    return `Across ${count} check-ins you chose to include, the recent average was ${formatNumber(currentMean ?? 0, language)} out of 10. The data does not show a clear difference between the two periods, or the comparison is incomplete.`;
  }
  return `The average of your recent ratings was ${formatNumber(currentMean, language)} out of 10, compared with ${formatNumber(previousMean, language)} in the previous period, a difference of ${formatNumber(Math.abs(currentMean - previousMean), language)} point(s). This describes your entries; it does not explain the cause.`;
}

export function dataLimitations(language: LanguageCode): readonly string[] {
  const copy: Record<LanguageCode, readonly string[]> = {
    en: [
      'This is a summary of entries you chose to record, not a mental-health assessment.',
      'A pattern in a log does not establish a cause or predict what will happen next.',
      'Missing context and small samples can change how this summary looks.',
    ],
    fr: [
      'Il s’agit d’un résumé des entrées que vous avez choisi d’enregistrer, et non d’une évaluation de santé mentale.',
      'Une tendance dans un journal n’établit pas de cause et ne prédit pas ce qui va arriver.',
      'Le contexte manquant et les petits échantillons peuvent modifier ce résumé.',
    ],
    es: [
      'Este es un resumen de los registros que decidiste guardar, no una evaluación de salud mental.',
      'Un patrón en un registro no demuestra una causa ni predice lo que ocurrirá.',
      'La falta de contexto y las muestras pequeñas pueden cambiar este resumen.',
    ],
  };
  return copy[language];
}

const UNSAFE_CLAIM_PATTERNS: readonly RegExp[] = [
  /you (?:have|are) (?:depressed|bipolar|ptsd|traumatized|mentally ill)/i,
  /this proves? (?:that )?you/i,
  /caused your (?:mood|distress|anxiety|symptoms)/i,
  /diagnos(?:is|ed|e)/i,
  /clinically significant/i,
  /predict(?:s|ion|ed)? your mental health/i,
];

export function findUnsupportedClinicalClaims(text: string): readonly string[] {
  return UNSAFE_CLAIM_PATTERNS.flatMap((expression) => expression.test(text) ? [expression.source] : []);
}

export function shouldDisplayNarrative(text: string, maxCharacters = 1600): boolean {
  return typeof text === 'string' && text.length > 0 && text.length <= maxCharacters && findUnsupportedClinicalClaims(text).length === 0;
}
