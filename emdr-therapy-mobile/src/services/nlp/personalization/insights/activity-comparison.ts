import { PERSONALIZATION_LIMITS, INSIGHT_LIMITATIONS } from '../core/config.ts';
import type { CheckInRecord, InsightCard, InsightEvidence, SupportToolId } from '../core/types.ts';
import { parseIso } from '../core/time.ts';
import { mean } from './statistics.ts';

export interface PairedActivitySummary {
  readonly activityId: SupportToolId;
  readonly pairCount: number;
  readonly meanBefore?: number;
  readonly meanAfter?: number;
  readonly meanRecordedDifference?: number;
  readonly card?: InsightCard;
}

/**
 * Describes explicitly paired before/after ratings only. Never attributes change to an activity,
 * infers efficacy, or uses unpaired records as if they belonged to the same visit.
 */
export function summarizePairedRatings(records: readonly CheckInRecord[], options: {
  readonly enabled: boolean;
  readonly now?: Date;
  readonly minimumPairs?: number;
}): readonly PairedActivitySummary[] {
  if (!options.enabled) return [];
  const now = options.now ?? new Date();
  const minimum = Math.max(5, options.minimumPairs ?? PERSONALIZATION_LIMITS.minInsightSamples);
  const groups = new Map<string, Partial<Record<'before' | 'after', CheckInRecord>>>();
  for (const record of records) {
    if (!record.aggregateConsent || !record.sessionGroupId || !record.activityId || typeof record.settlednessRating !== 'number') continue;
    const at = parseIso(record.createdAt);
    if (!at || at.getTime() > now.getTime()) continue;
    const key = `${record.sessionGroupId}::${record.activityId}`;
    const pair = groups.get(key) ?? {};
    if (record.phase === 'before' || record.phase === 'after') pair[record.phase] = record;
    groups.set(key, pair);
  }
  const byActivity = new Map<SupportToolId, { before: number[]; after: number[]; stamps: string[] }>();
  for (const pair of groups.values()) {
    if (!pair.before || !pair.after || !pair.before.activityId) continue;
    if (pair.before.sessionGroupId !== pair.after.sessionGroupId || pair.before.activityId !== pair.after.activityId) continue;
    const group = byActivity.get(pair.before.activityId) ?? { before: [], after: [], stamps: [] };
    group.before.push(pair.before.settlednessRating!);
    group.after.push(pair.after.settlednessRating!);
    group.stamps.push(pair.after.createdAt);
    byActivity.set(pair.before.activityId, group);
  }
  const results: PairedActivitySummary[] = [];
  for (const [activityId, group] of byActivity) {
    if (group.before.length < minimum) continue;
    const before = mean(group.before);
    const after = mean(group.after);
    if (before === undefined || after === undefined) continue;
    const difference = after - before;
    const evidence: InsightEvidence = {
      metric: 'paired-user-reported-rating-difference', sampleSize: group.before.length,
      windowStart: [...group.stamps].sort()[0], windowEnd: [...group.stamps].sort().at(-1)!,
      value: difference, confidence: group.before.length >= minimum * 3 ? 'higher' : group.before.length >= minimum * 2 ? 'moderate' : 'low',
    };
    const card: InsightCard = {
      id: `paired-rating-${activityId}-${now.toISOString().slice(0, 10)}`, kind: 'pattern',
      title: 'Ratings you logged before and after',
      body: `For ${group.before.length} explicitly paired records for “${activityId.replace(/-/g, ' ')}”, your average rating was ${before.toFixed(1)} before and ${after.toFixed(1)} after. These entries cannot show that the activity caused the difference, and the comparison may omit context.`,
      createdAt: now.toISOString(), evidence: [evidence], limitations: [...INSIGHT_LIMITATIONS],
      actions: [{ id: 'view-details', label: 'View details' }, { id: 'dismiss', label: 'Dismiss' }, { id: 'clear-history', label: 'Clear history' }],
      requiresUserOptIn: true,
    };
    results.push({ activityId, pairCount: group.before.length, meanBefore: before, meanAfter: after, meanRecordedDifference: difference, card });
  }
  return results;
}
