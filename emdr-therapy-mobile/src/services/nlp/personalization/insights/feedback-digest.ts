import type { ActivityFeedbackRecord, InsightCard, InsightEvidence, SupportToolId } from '../core/types.ts';
import { INSIGHT_LIMITATIONS, PERSONALIZATION_LIMITS } from '../core/config.ts';
import { parseIso } from '../core/time.ts';

export interface ActivityFeedbackSummary {
  readonly activityId: SupportToolId;
  readonly ratings: number;
  readonly averageHelpfulness: number;
  readonly skippedCount: number;
  readonly lastFeedbackAt: string;
}

export interface FeedbackDigestResult {
  readonly eligible: boolean;
  readonly reason?: 'disabled' | 'not-enough-feedback';
  readonly summaries: readonly ActivityFeedbackSummary[];
  readonly cards: readonly InsightCard[];
}

export function summarizeFeedback(records: readonly ActivityFeedbackRecord[], now = new Date(), days = 180): readonly ActivityFeedbackSummary[] {
  const cutoff = now.getTime() - Math.max(7, Math.min(730, days)) * 86_400_000;
  const groups = new Map<SupportToolId, ActivityFeedbackRecord[]>();
  for (const record of records) {
    const date = parseIso(record.createdAt);
    if (!date || date.getTime() > now.getTime() || date.getTime() < cutoff) continue;
    const list = groups.get(record.activityId) ?? [];
    list.push(record);
    groups.set(record.activityId, list);
  }
  return [...groups.entries()].map(([activityId, items]) => {
    const rated = items.filter((item) => !item.skipped);
    const latest = items.reduce((a, b) => a.createdAt > b.createdAt ? a : b);
    return {
      activityId, ratings: rated.length,
      averageHelpfulness: rated.length ? rated.reduce((sum, item) => sum + item.helpfulness, 0) / rated.length : 0,
      skippedCount: items.filter((item) => item.skipped).length,
      lastFeedbackAt: latest.createdAt,
    };
  }).sort((a, b) => b.ratings - a.ratings || a.activityId.localeCompare(b.activityId));
}

export function buildFeedbackDigest(records: readonly ActivityFeedbackRecord[], options: {
  readonly enabled: boolean;
  readonly now?: Date;
  readonly days?: number;
  readonly minimumTotalRatings?: number;
}): FeedbackDigestResult {
  if (!options.enabled) return { eligible: false, reason: 'disabled', summaries: [], cards: [] };
  const now = options.now ?? new Date();
  const summaries = summarizeFeedback(records, now, options.days ?? 180);
  const totalRatings = summaries.reduce((sum, item) => sum + item.ratings, 0);
  const minimum = Math.max(5, options.minimumTotalRatings ?? PERSONALIZATION_LIMITS.minInsightSamples);
  if (totalRatings < minimum) return { eligible: false, reason: 'not-enough-feedback', summaries, cards: [] };
  const highRated = summaries.filter((item) => item.ratings >= 3 && item.averageHelpfulness >= 4);
  const highSkipped = summaries.filter((item) => item.skippedCount >= 3);
  const cards: InsightCard[] = [];
  if (highRated.length) {
    const top = highRated[0];
    const evidence: InsightEvidence = { metric: 'explicit-activity-helpfulness', sampleSize: top.ratings,
      windowStart: new Date(now.getTime() - (options.days ?? 180) * 86_400_000).toISOString(), windowEnd: now.toISOString(),
      value: top.averageHelpfulness, confidence: top.ratings >= 9 ? 'higher' : top.ratings >= 6 ? 'moderate' : 'low' };
    cards.push({ id: `feedback-favorite-${top.activityId}-${now.toISOString().slice(0, 10)}`, kind: 'preference',
      title: 'Options you rated as helpful',
      body: `You gave “${top.activityId.replace(/-/g, ' ')}” an average helpfulness rating of ${top.averageHelpfulness.toFixed(1)} across ${top.ratings} ratings. This is your feedback about the app option, not an assessment of a clinical outcome.`,
      createdAt: now.toISOString(), evidence: [evidence], limitations: [...INSIGHT_LIMITATIONS],
      actions: [{ id: 'adjust-preferences', label: 'Adjust preferences' }, { id: 'clear-history', label: 'Clear feedback history' }, { id: 'dismiss', label: 'Dismiss' }], requiresUserOptIn: true });
  }
  if (highSkipped.length) {
    const item = highSkipped[0];
    const evidence: InsightEvidence = { metric: 'explicit-activity-skips', sampleSize: item.skippedCount,
      windowStart: new Date(now.getTime() - (options.days ?? 180) * 86_400_000).toISOString(), windowEnd: now.toISOString(),
      value: item.skippedCount, confidence: item.skippedCount >= 9 ? 'higher' : item.skippedCount >= 6 ? 'moderate' : 'low' };
    cards.push({ id: `feedback-skipped-${item.activityId}-${now.toISOString().slice(0, 10)}`, kind: 'preference',
      title: 'Options you often skipped',
      body: `You skipped “${item.activityId.replace(/-/g, ' ')}” ${item.skippedCount} time(s). You can leave it out of future suggestions or keep it available.`,
      createdAt: now.toISOString(), evidence: [evidence], limitations: [...INSIGHT_LIMITATIONS],
      actions: [{ id: 'adjust-preferences', label: 'Adjust preferences' }, { id: 'dismiss', label: 'Dismiss' }], requiresUserOptIn: true });
  }
  return { eligible: true, summaries, cards: cards.slice(0, 3) };
}
