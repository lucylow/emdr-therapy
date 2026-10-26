import { PERSONALIZATION_LIMITS, INSIGHT_LIMITATIONS } from '../core/config.ts';
import { parseIso } from '../core/time.ts';
import type { CheckInRecord, InsightCard, InsightEvidence } from '../core/types.ts';
import { median, percentile } from './statistics.ts';

export interface BaselineResult {
  readonly eligible: boolean;
  readonly reason?: 'not-enough-samples' | 'invalid-values' | 'no-baseline';
  readonly sampleSize: number;
  readonly baselineMedian?: number;
  readonly interquartileRange?: readonly [number, number];
  readonly card?: InsightCard;
}

/** Uses a robust median summary to reduce the influence of one unusually high/low self-rating. */
export function buildSettlednessBaseline(records: readonly CheckInRecord[], options: {
  readonly enabled: boolean;
  readonly now?: Date;
  readonly days?: number;
  readonly minimumSamples?: number;
}): BaselineResult {
  if (!options.enabled) return { eligible: false, reason: 'not-enough-samples', sampleSize: 0 };
  const now = options.now ?? new Date();
  const days = Math.max(7, Math.min(365, Math.floor(options.days ?? 90)));
  const minimum = Math.max(PERSONALIZATION_LIMITS.minInsightSamples, options.minimumSamples ?? 5);
  const start = now.getTime() - days * 86_400_000;
  const values = records.flatMap((record) => {
    if (!record.aggregateConsent || typeof record.settlednessRating !== 'number') return [];
    const at = parseIso(record.createdAt);
    if (!at || at.getTime() > now.getTime() || at.getTime() < start || record.settlednessRating < 0 || record.settlednessRating > 10) return [];
    return [{ value: record.settlednessRating, createdAt: at.toISOString() }];
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (values.length < minimum) return { eligible: false, reason: 'not-enough-samples', sampleSize: values.length };
  const valuesOnly = values.map((item) => item.value);
  const middle = median(valuesOnly);
  const lower = percentile(valuesOnly, 0.25);
  const upper = percentile(valuesOnly, 0.75);
  if (middle === undefined || lower === undefined || upper === undefined) return { eligible: false, reason: 'invalid-values', sampleSize: values.length };
  const evidence: InsightEvidence = {
    metric: 'user-reported-settledness-median', sampleSize: values.length,
    windowStart: new Date(start).toISOString(), windowEnd: now.toISOString(), value: middle,
    confidence: values.length >= minimum * 3 ? 'higher' : values.length >= minimum * 2 ? 'moderate' : 'low',
  };
  const card: InsightCard = {
    id: `settledness-baseline-${now.toISOString().slice(0, 10)}`, kind: 'pattern',
    title: 'A baseline from your entries',
    body: `Across ${values.length} check-ins you chose to include over ${days} days, the middle settledness rating was ${middle.toFixed(1)} out of 10. Half of the recorded ratings fell between ${lower.toFixed(1)} and ${upper.toFixed(1)}. This summarizes your entries; it does not define a target or indicate a diagnosis.`,
    createdAt: now.toISOString(), evidence: [evidence], limitations: [...INSIGHT_LIMITATIONS],
    actions: [{ id: 'view-details', label: 'View details' }, { id: 'dismiss', label: 'Dismiss' }, { id: 'clear-history', label: 'Clear history' }],
    requiresUserOptIn: true,
  };
  return { eligible: true, sampleSize: values.length, baselineMedian: middle, interquartileRange: [lower, upper], card };
}

export function compareToBaseline(value: number, baseline: number, tolerance = 0.75): 'above' | 'within' | 'below' | 'invalid' {
  if (![value, baseline, tolerance].every(Number.isFinite) || tolerance < 0) return 'invalid';
  if (value > baseline + tolerance) return 'above';
  if (value < baseline - tolerance) return 'below';
  return 'within';
}
