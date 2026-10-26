import type { CheckInRecord } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface ChartPoint {
  readonly label: string;
  readonly timestamp: string;
  readonly value: number;
  readonly count: number;
}
export interface ChartSeries {
  readonly title: string;
  readonly unit: 'rating-out-of-10';
  readonly points: readonly ChartPoint[];
  readonly suppressedBuckets: number;
  readonly note: string;
}

/**
 * Makes coarse time buckets for a mobile chart, suppressing buckets with too few opted-in entries.
 * Never emits per-check-in labels, raw IDs, notes, or exact timestamps to the chart component.
 */
export function buildSettlednessChart(records: readonly CheckInRecord[], options: {
  readonly enabled: boolean;
  readonly now?: Date;
  readonly days?: number;
  readonly bucketDays?: number;
  readonly minimumPerBucket?: number;
}): ChartSeries | undefined {
  if (!options.enabled) return undefined;
  const now = options.now ?? new Date();
  const days = Math.max(14, Math.min(365, Math.floor(options.days ?? 90)));
  const bucketDays = Math.max(7, Math.min(30, Math.floor(options.bucketDays ?? 7)));
  const minimum = Math.max(3, Math.floor(options.minimumPerBucket ?? 5));
  const cutoff = now.getTime() - days * 86_400_000;
  const bucketCount = Math.ceil(days / bucketDays);
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    start: cutoff + index * bucketDays * 86_400_000,
    end: Math.min(now.getTime() + 1, cutoff + (index + 1) * bucketDays * 86_400_000),
    values: [] as number[],
  }));
  for (const record of records) {
    if (!record.aggregateConsent || typeof record.settlednessRating !== 'number' || record.settlednessRating < 0 || record.settlednessRating > 10) continue;
    const at = parseIso(record.createdAt)?.getTime();
    if (at === undefined || at < cutoff || at > now.getTime()) continue;
    const index = Math.min(bucketCount - 1, Math.floor((at - cutoff) / (bucketDays * 86_400_000)));
    buckets[index]?.values.push(record.settlednessRating);
  }
  const points: ChartPoint[] = [];
  let suppressedBuckets = 0;
  for (const bucket of buckets) {
    if (bucket.values.length < minimum) { suppressedBuckets++; continue; }
    const value = bucket.values.reduce((sum, current) => sum + current, 0) / bucket.values.length;
    points.push({ label: new Date(bucket.start).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      timestamp: new Date(bucket.start).toISOString().slice(0, 10), value, count: bucket.values.length });
  }
  return { title: 'Your logged ratings', unit: 'rating-out-of-10', points, suppressedBuckets,
    note: 'Each point summarizes only check-ins you opted to include. Empty or small groups are hidden; this chart is not a clinical measure.' };
}

export function downsampleChart<T>(points: readonly T[], maxPoints = 40): readonly T[] {
  const max = Math.max(2, Math.min(200, Math.floor(maxPoints)));
  if (points.length <= max) return points;
  const result: T[] = [];
  for (let i = 0; i < max; i++) result.push(points[Math.round(i * (points.length - 1) / (max - 1))]);
  return [...new Set(result)];
}

export function validateChartSeries(series: ChartSeries): boolean {
  return series.unit === 'rating-out-of-10' && series.points.length <= 200
    && series.points.every((point) => point.count >= 1 && Number.isFinite(point.value) && point.value >= 0 && point.value <= 10
      && /^\d{4}-\d{2}-\d{2}$/.test(point.timestamp));
}
