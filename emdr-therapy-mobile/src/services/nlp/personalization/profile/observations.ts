import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { confidenceFromEvidence, evidenceWeight } from './decay.ts';
import type { ActivityFeedbackRecord, SupportToolId } from '../core/types.ts';

export interface ToolObservation {
  readonly activityId: SupportToolId;
  readonly count: number;
  readonly weightedMean: number;
  readonly rawMean: number;
  readonly confidence: number;
  readonly lastSeenAt: string;
}

export interface ObservationSummary {
  readonly totalRatings: number;
  readonly tools: readonly ToolObservation[];
  readonly sampleEnoughForSuggestions: boolean;
}

/** Counts only explicit ratings/skips; never observes session timing or infers mental state. */
export function summarizeActivityFeedback(records: readonly ActivityFeedbackRecord[], now = new Date()): ObservationSummary {
  const cutoff = now.getTime() - 365 * 86_400_000;
  const groups = new Map<SupportToolId, ActivityFeedbackRecord[]>();
  for (const record of records) {
    const time = new Date(record.createdAt).getTime();
    if (!Number.isFinite(time) || time > now.getTime() || time < cutoff) continue;
    const items = groups.get(record.activityId) ?? [];
    items.push(record);
    groups.set(record.activityId, items);
  }
  const tools = [...groups.entries()].map(([activityId, entries]) => {
    const latest = entries.reduce((a, b) => new Date(a.createdAt).getTime() > new Date(b.createdAt).getTime() ? a : b);
    const rated = entries.filter((entry) => !entry.skipped && entry.source === 'explicit-rating');
    const weighted = rated.reduce((acc, entry) => {
      const weight = evidenceWeight({ observedAt: entry.createdAt, now, halfLifeDays: 90 });
      return { numerator: acc.numerator + entry.helpfulness * weight, denominator: acc.denominator + weight };
    }, { numerator: 0, denominator: 0 });
    const rawMean = rated.length ? rated.reduce((sum, entry) => sum + entry.helpfulness, 0) / rated.length : 0;
    return {
      activityId, count: rated.length,
      weightedMean: weighted.denominator ? weighted.numerator / weighted.denominator : rawMean,
      rawMean,
      confidence: confidenceFromEvidence(rated.length, rated.length ? weighted.denominator / rated.length : 0, PERSONALIZATION_LIMITS.maxPreferenceConfidence),
      lastSeenAt: latest.createdAt,
    };
  }).filter((item) => item.count > 0).sort((a, b) => b.weightedMean - a.weightedMean || b.count - a.count || a.activityId.localeCompare(b.activityId));
  const totalRatings = tools.reduce((sum, item) => sum + item.count, 0);
  return { totalRatings, tools, sampleEnoughForSuggestions: tools.some((item) => item.count >= PERSONALIZATION_LIMITS.minRecommendationEvidence) };
}

export function proposedPreferredTools(summary: ObservationSummary, minimumMean = 4, maxTools = 3): readonly SupportToolId[] {
  return summary.tools.filter((tool) => tool.count >= PERSONALIZATION_LIMITS.minObservedEvidence && tool.rawMean >= minimumMean)
    .slice(0, Math.max(1, Math.min(5, maxTools))).map((tool) => tool.activityId);
}

export function skippedFrequently(records: readonly ActivityFeedbackRecord[], activityId: SupportToolId, minimum = 3): boolean {
  return records.filter((record) => record.activityId === activityId && record.skipped === true && record.source === 'explicit-skip').length >= minimum;
}
