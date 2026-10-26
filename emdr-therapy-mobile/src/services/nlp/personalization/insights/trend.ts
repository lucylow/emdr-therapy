import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { parseIso } from '../core/time.ts';
import { filterRatings, makeWindow, type DatedRating } from './dates.ts';
import { mean, linearSlope, summarize } from './statistics.ts';
import { evidenceConfidence } from './suppression.ts';
import { buildTrendNarrative, dataLimitations } from './copy.ts';
import type { LanguageCode } from '../core/types.ts';
import type { CheckInRecord, InsightCard, InsightEvidence } from '../core/types.ts';

export interface TrendOptions {
  readonly enabled: boolean;
  readonly now?: Date;
  readonly windowDays?: number;
  readonly minimumSamples?: number;
  readonly language?: LanguageCode;
}

export interface TrendResult {
  readonly eligible: boolean;
  readonly reason?: 'disabled' | 'not-enough-samples' | 'not-enough-days' | 'invalid-data';
  readonly card?: InsightCard;
  readonly currentMean?: number;
  readonly previousMean?: number;
  readonly sampleSize: number;
  readonly slopePerEntry?: number;
}

function windowMean(records: readonly DatedRating[], startMs: number, endMs: number): number | undefined {
  const values = records.filter((r) => {
    const t = new Date(r.timestamp).getTime(); return t >= startMs && t < endMs;
  }).map((r) => r.rating);
  return mean(values);
}

export function buildSettlednessTrend(records: readonly CheckInRecord[], options: TrendOptions): TrendResult {
  if (!options.enabled) return { eligible: false, reason: 'disabled', sampleSize: 0 };
  const now = options.now ?? new Date();
  const days = Math.max(14, Math.min(180, Math.floor(options.windowDays ?? 28)));
  const minimum = Math.max(PERSONALIZATION_LIMITS.minInsightSamples, options.minimumSamples ?? 5);
  const eligibleRecords = filterRatings(records, now, days * 2);
  if (eligibleRecords.some((record) => !parseIso(record.timestamp))) return { eligible: false, reason: 'invalid-data', sampleSize: 0 };
  if (eligibleRecords.length < minimum) return { eligible: false, reason: 'not-enough-samples', sampleSize: eligibleRecords.length };
  const midpoint = now.getTime() - days * 86_400_000;
  const currentMean = windowMean(eligibleRecords, midpoint, now.getTime() + 1);
  const previousMean = windowMean(eligibleRecords, now.getTime() - 2 * days * 86_400_000, midpoint);
  const summary = summarize(eligibleRecords.map((entry) => entry.rating));
  const daysCount = new Set(eligibleRecords.map((r) => r.timestamp.slice(0, 10))).size;
  if (daysCount < 3 || !summary) return { eligible: false, reason: 'not-enough-days', sampleSize: eligibleRecords.length };
  const slope = linearSlope(eligibleRecords.map((entry) => entry.rating));
  const delta = currentMean !== undefined && previousMean !== undefined ? currentMean - previousMean : undefined;
  const language = options.language ?? 'en';
  const body = buildTrendNarrative({ count: eligibleRecords.length, days, currentMean, previousMean, language });
  const evidence: InsightEvidence[] = [{
    metric: 'user-reported-settledness-average', sampleSize: eligibleRecords.length,
    windowStart: makeWindow(now, days * 2).start, windowEnd: now.toISOString(),
    value: currentMean, baselineValue: previousMean, confidence: evidenceConfidence(eligibleRecords.length, minimum),
  }];
  const card: InsightCard = {
    id: `settledness-trend-${now.toISOString().slice(0, 10)}`, kind: 'pattern',
    title: ({ en: 'A look at your check-ins', fr: 'Un aperçu de vos bilans', es: 'Un vistazo a tus registros' } as const)[language], body, createdAt: now.toISOString(), evidence,
    limitations: [...dataLimitations(language)],
    actions: [
      { id: 'view-details', label: ({ en: 'View details', fr: 'Voir les détails', es: 'Ver detalles' } as const)[language] },
      { id: 'dismiss', label: ({ en: 'Dismiss', fr: 'Ignorer', es: 'Descartar' } as const)[language] },
      { id: 'clear-history', label: ({ en: 'Clear history', fr: 'Effacer l’historique', es: 'Borrar historial' } as const)[language] },
    ],
    requiresUserOptIn: true,
  };
  return { eligible: true, card, currentMean, previousMean, sampleSize: eligibleRecords.length, slopePerEntry: slope };
}

export function ratingsByPhase(records: readonly CheckInRecord[]): Readonly<Record<'before' | 'after' | 'standalone', readonly number[]>> {
  const result: Record<'before' | 'after' | 'standalone', number[]> = { before: [], after: [], standalone: [] };
  for (const record of records) {
    if (!record.aggregateConsent || typeof record.settlednessRating !== 'number') continue;
    result[record.phase].push(record.settlednessRating);
  }
  return result;
}
