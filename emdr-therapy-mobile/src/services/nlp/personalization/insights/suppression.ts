import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import type { CheckInRecord, InsightCard, InsightEvidence } from '../core/types.ts';
import { countDistinctUtcDates } from './dates.ts';

export type SuppressionReason = 'disabled' | 'not-enough-entries' | 'not-enough-days' | 'stale-data' | 'low-quality' | 'duplicate';
export interface SuppressionDecision { readonly show: boolean; readonly reason?: SuppressionReason; }

export function evaluateInsightEligibility(input: {
  readonly enabled: boolean;
  readonly recordCount: number;
  readonly datedRecords: readonly { readonly timestamp: string }[];
  readonly oldestWindowDays?: number;
  readonly minimumSamples?: number;
}): SuppressionDecision {
  if (!input.enabled) return { show: false, reason: 'disabled' };
  const minimum = input.minimumSamples ?? PERSONALIZATION_LIMITS.minInsightSamples;
  if (input.recordCount < minimum) return { show: false, reason: 'not-enough-entries' };
  if (countDistinctUtcDates(input.datedRecords) < 3) return { show: false, reason: 'not-enough-days' };
  if (input.oldestWindowDays !== undefined && input.oldestWindowDays > PERSONALIZATION_LIMITS.maxInsightAgeDays) return { show: false, reason: 'stale-data' };
  return { show: true };
}

export function suppressionCopy(reason: SuppressionReason, language: 'en' | 'fr' | 'es' = 'en'): string {
  const copy: Record<SuppressionReason, Record<'en' | 'fr' | 'es', string>> = {
    disabled: { en: 'Insights are turned off.', fr: 'Les aperçus sont désactivés.', es: 'Los resúmenes están desactivados.' },
    'not-enough-entries': { en: 'Add a few more optional check-ins to see a summary.', fr: 'Ajoutez quelques bilans facultatifs pour voir un résumé.', es: 'Añade algunos registros opcionales más para ver un resumen.' },
    'not-enough-days': { en: 'More days of entries are needed before showing a pattern.', fr: 'Il faut des entrées sur davantage de jours avant de montrer une tendance.', es: 'Se necesitan registros de más días antes de mostrar un patrón.' },
    'stale-data': { en: 'These entries are too old for a current summary.', fr: 'Ces entrées sont trop anciennes pour un résumé actuel.', es: 'Estos registros son demasiado antiguos para un resumen actual.' },
    'low-quality': { en: 'There is not enough consistent data for a useful summary.', fr: 'Les données ne sont pas assez cohérentes pour un résumé utile.', es: 'Los datos no son lo bastante consistentes para un resumen útil.' },
    duplicate: { en: 'This pattern was already shown.', fr: 'Cette tendance a déjà été affichée.', es: 'Este patrón ya se mostró.' },
  };
  return copy[reason][language];
}

export function suppressDuplicateInsights(cards: readonly InsightCard[], seenIds: ReadonlySet<string>, max = 5): readonly InsightCard[] {
  return cards.filter((card) => !seenIds.has(card.id)).slice(0, Math.max(0, Math.min(max, PERSONALIZATION_LIMITS.maxInsightCards)));
}

export function evidenceConfidence(sampleSize: number, minSamples: number = PERSONALIZATION_LIMITS.minInsightSamples): InsightEvidence['confidence'] {
  if (sampleSize >= minSamples * 3) return 'higher';
  if (sampleSize >= minSamples * 2) return 'moderate';
  return 'low';
}

export function privacyMinimumAggregate(records: readonly CheckInRecord[], minimum = PERSONALIZATION_LIMITS.minInsightSamples): boolean {
  return records.filter((record) => record.aggregateConsent).length >= minimum;
}
