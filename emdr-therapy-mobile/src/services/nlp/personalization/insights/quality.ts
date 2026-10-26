import type { CheckInRecord } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface CheckInQualityReport {
  readonly total: number;
  readonly includedInInsights: number;
  readonly excludedFromInsights: number;
  readonly invalidDates: number;
  readonly futureDates: number;
  readonly invalidRatings: number;
  readonly duplicateIds: readonly string[];
  readonly duplicateDayCount: number;
  readonly qualityLevel: 'not-enough-data' | 'limited' | 'usable' | 'review-needed';
  readonly explanations: readonly string[];
}

export function auditCheckInQuality(records: readonly CheckInRecord[], now = new Date()): CheckInQualityReport {
  let invalidDates = 0;
  let futureDates = 0;
  let invalidRatings = 0;
  let includedInInsights = 0;
  const ids = new Set<string>();
  const duplicateIds = new Set<string>();
  const dayCounts = new Map<string, number>();
  for (const record of records) {
    if (ids.has(record.id)) duplicateIds.add(record.id);
    ids.add(record.id);
    const date = parseIso(record.createdAt);
    if (!date) { invalidDates++; continue; }
    if (date.getTime() > now.getTime()) futureDates++;
    else dayCounts.set(date.toISOString().slice(0, 10), (dayCounts.get(date.toISOString().slice(0, 10)) ?? 0) + 1);
    if (record.settlednessRating !== undefined && (!Number.isFinite(record.settlednessRating) || record.settlednessRating < 0 || record.settlednessRating > 10)) invalidRatings++;
    if (record.aggregateConsent) includedInInsights++;
  }
  const excludedFromInsights = records.length - includedInInsights;
  const explanations: string[] = [];
  if (includedInInsights < 5) explanations.push('Fewer than five entries are opted in; summaries should be suppressed.');
  if (invalidDates || futureDates || invalidRatings || duplicateIds.size) explanations.push('Some records require review or exclusion from summaries.');
  if (excludedFromInsights) explanations.push(`${excludedFromInsights} entries were not opted into aggregate insights.`);
  const qualityLevel = invalidDates || futureDates || invalidRatings || duplicateIds.size ? 'review-needed'
    : includedInInsights < 5 ? 'not-enough-data'
      : includedInInsights < 10 ? 'limited' : 'usable';
  return {
    total: records.length, includedInInsights, excludedFromInsights, invalidDates, futureDates, invalidRatings,
    duplicateIds: [...duplicateIds], duplicateDayCount: [...dayCounts.values()].filter((count) => count > 1).length,
    qualityLevel, explanations,
  };
}

export function selectQualityApprovedRecords(records: readonly CheckInRecord[], now = new Date()): readonly CheckInRecord[] {
  const ids = new Set<string>();
  return records.flatMap((record) => {
    const at = parseIso(record.createdAt);
    if (!at || at.getTime() > now.getTime() || !record.aggregateConsent || ids.has(record.id)) return [];
    if (record.settlednessRating !== undefined && (!Number.isFinite(record.settlednessRating) || record.settlednessRating < 0 || record.settlednessRating > 10)) return [];
    ids.add(record.id);
    return [record];
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
