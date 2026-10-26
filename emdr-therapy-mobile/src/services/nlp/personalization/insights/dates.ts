import { parseIso } from '../core/time.ts';
import type { CheckInRecord } from '../core/types.ts';

export interface DatedRating {
  readonly id: string;
  readonly timestamp: string;
  readonly rating: number;
}

export interface DateWindow {
  readonly start: string;
  readonly end: string;
  readonly days: number;
}

export function makeWindow(now: Date, days: number): DateWindow {
  const safeDays = Math.max(1, Math.min(366, Math.floor(days)));
  return { start: new Date(now.getTime() - safeDays * 86_400_000).toISOString(), end: now.toISOString(), days: safeDays };
}

export function filterRatings(records: readonly CheckInRecord[], now: Date, days: number): readonly DatedRating[] {
  const cutoff = now.getTime() - Math.max(1, Math.floor(days)) * 86_400_000;
  return records.flatMap((record) => {
    const date = parseIso(record.createdAt);
    if (!date || date.getTime() > now.getTime() || date.getTime() < cutoff || !record.aggregateConsent) return [];
    if (typeof record.settlednessRating !== 'number' || !Number.isFinite(record.settlednessRating)) return [];
    if (record.settlednessRating < 0 || record.settlednessRating > 10) return [];
    return [{ id: record.id, timestamp: date.toISOString(), rating: record.settlednessRating }];
  }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function groupByUtcDate<T extends { readonly timestamp: string }>(records: readonly T[]): ReadonlyMap<string, readonly T[]> {
  const groups = new Map<string, T[]>();
  for (const record of records) {
    const date = parseIso(record.timestamp);
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(record);
    groups.set(key, list);
  }
  return groups;
}

export function countDistinctUtcDates(records: readonly { readonly timestamp: string }[]): number {
  return groupByUtcDate(records).size;
}

export function isoWeekday(isoTimestamp: string): number | undefined {
  const parsed = parseIso(isoTimestamp);
  if (!parsed) return undefined;
  const day = parsed.getUTCDay();
  return day === 0 ? 7 : day;
}

export function isSameUtcDate(a: string, b: string): boolean {
  const pa = parseIso(a);
  const pb = parseIso(b);
  return !!pa && !!pb && pa.toISOString().slice(0, 10) === pb.toISOString().slice(0, 10);
}
