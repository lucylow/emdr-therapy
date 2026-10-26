import type { ChatIntent, ResponseSource, ChatFeedbackEvent } from '../types.ts';

export interface FeedbackObservation { intent: ChatIntent; source: ResponseSource; rating: 'helpful' | 'not_helpful'; issue?: ChatFeedbackEvent['issue']; timestamp: number; }
export interface FeedbackInsight { id: string; kind: 'quality_signal' | 'sample_size' | 'source_comparison'; intent?: ChatIntent; source?: ResponseSource; sampleCount: number; helpfulRate?: number; summary: string; confidence: 'low' | 'moderate' | 'high'; }
export interface FeedbackInsightOptions { minimumSample?: number; maxAgeMs?: number; now?: () => number; }

/**
 * Converts categorical feedback into privacy-conscious quality hints. It never stores or accepts message text.
 * Output describes aggregate response quality; it is not a user trait, emotional pattern, or clinical inference.
 */
export function buildFeedbackInsights(observations: readonly FeedbackObservation[], options: FeedbackInsightOptions = {}): FeedbackInsight[] {
  const now = options.now?.() ?? Date.now();
  const minimumSample = boundedInt(options.minimumSample, 5, 3, 100);
  const maxAgeMs = boundedInt(options.maxAgeMs, 90 * 24 * 60 * 60_000, 60_000, 365 * 24 * 60 * 60_000);
  const valid = observations.filter((item) => Number.isFinite(item.timestamp) && item.timestamp <= now && now - item.timestamp <= maxAgeMs && ['helpful', 'not_helpful'].includes(item.rating));
  const buckets = new Map<string, { intent: ChatIntent; source: ResponseSource; helpful: number; total: number; issues: Map<string, number> }>();
  for (const observation of valid) {
    const key = `${observation.intent}|${observation.source}`;
    const row = buckets.get(key) ?? { intent: observation.intent, source: observation.source, helpful: 0, total: 0, issues: new Map<string, number>() };
    row.total++;
    if (observation.rating === 'helpful') row.helpful++;
    if (observation.issue) row.issues.set(observation.issue, (row.issues.get(observation.issue) ?? 0) + 1);
    buckets.set(key, row);
  }
  const insights: FeedbackInsight[] = [];
  for (const row of buckets.values()) {
    if (row.total < minimumSample) {
      insights.push({ id: `sample-${row.intent}-${row.source}`, kind: 'sample_size', intent: row.intent, source: row.source, sampleCount: row.total, confidence: 'low', summary: 'Collect more optional categorical feedback before comparing this response route.' });
      continue;
    }
    const rate = row.helpful / row.total;
    const confidence = row.total >= minimumSample * 5 ? 'high' : row.total >= minimumSample * 2 ? 'moderate' : 'low';
    let summary: string;
    if (rate < 0.45) summary = 'This route receives comparatively low helpfulness ratings; review its examples, tone, and fallback behavior.';
    else if (rate > 0.82) summary = 'This route receives mostly helpful ratings in this sample; keep monitoring for regressions.';
    else summary = 'Ratings for this route are mixed; inspect issue categories and gather more varied feedback.';
    insights.push({ id: `quality-${row.intent}-${row.source}`, kind: 'quality_signal', intent: row.intent, source: row.source, sampleCount: row.total, helpfulRate: Number(rate.toFixed(3)), summary, confidence });
    if (row.issues.size > 0) {
      const [issue, count] = [...row.issues.entries()].sort((a, b) => b[1] - a[1])[0]!;
      if (count >= minimumSample) insights.push({ id: `issue-${row.intent}-${row.source}-${issue}`, kind: 'quality_signal', intent: row.intent, source: row.source, sampleCount: count, confidence: count >= minimumSample * 3 ? 'moderate' : 'low', summary: `Review the ${issue.replaceAll('_', ' ')} category for this route; this is aggregate feedback only.` });
    }
  }
  return insights.sort((a, b) => b.sampleCount - a.sampleCount || a.id.localeCompare(b.id));
}

/** Differential comparison only appears when each arm satisfies the minimum sample floor. */
export function compareFeedbackSources(observations: readonly FeedbackObservation[], options: FeedbackInsightOptions = {}): FeedbackInsight[] {
  const now = options.now?.() ?? Date.now();
  const min = boundedInt(options.minimumSample, 5, 3, 100);
  const age = boundedInt(options.maxAgeMs, 90 * 24 * 60 * 60_000, 60_000, 365 * 24 * 60 * 60_000);
  const buckets = new Map<ChatIntent, Map<ResponseSource, { total: number; helpful: number }>>();
  for (const item of observations) {
    if (now - item.timestamp > age || item.timestamp > now) continue;
    const bySource = buckets.get(item.intent) ?? new Map<ResponseSource, { total: number; helpful: number }>();
    const row = bySource.get(item.source) ?? { total: 0, helpful: 0 };
    row.total++; if (item.rating === 'helpful') row.helpful++;
    bySource.set(item.source, row); buckets.set(item.intent, bySource);
  }
  const output: FeedbackInsight[] = [];
  for (const [intent, bySource] of buckets) {
    const validArms = [...bySource.entries()].filter(([, row]) => row.total >= min);
    if (validArms.length < 2) continue;
    const sorted = validArms.sort((a, b) => (b[1].helpful / b[1].total) - (a[1].helpful / a[1].total));
    const [bestSource, best] = sorted[0]!; const [lowerSource, lower] = sorted.at(-1)!;
    const delta = best.helpful / best.total - lower.helpful / lower.total;
    output.push({ id: `compare-${intent}`, kind: 'source_comparison', intent, sampleCount: best.total + lower.total, helpfulRate: Number(delta.toFixed(3)), confidence: Math.min(best.total, lower.total) >= min * 5 ? 'high' : 'moderate', summary: `In this sample, ${bestSource} scores ${(delta * 100).toFixed(0)} percentage points higher than ${lowerSource}. This is observational, not causal.` });
  }
  return output;
}
function boundedInt(value: number | undefined, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback; }
