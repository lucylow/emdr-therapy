import type { CheckInRecord, ThemeId } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface ThemeFrequency {
  readonly theme: ThemeId;
  readonly count: number;
  readonly proportionOfTaggedEntries: number;
}

export interface LoggingPattern {
  readonly windowDays: number;
  readonly distinctLoggingDays: number;
  readonly totalEntries: number;
  readonly averageEntriesPerLoggingDay: number;
  readonly weekdayCounts: readonly { weekday: number; count: number }[];
  readonly note: string;
}

export function computeThemeFrequency(records: readonly CheckInRecord[], now = new Date(), windowDays = 90): readonly ThemeFrequency[] {
  const lower = now.getTime() - Math.max(1, Math.min(365, windowDays)) * 86_400_000;
  const eligible = records.filter((record) => {
    const at = parseIso(record.createdAt);
    return record.aggregateConsent && !!at && at.getTime() >= lower && at.getTime() <= now.getTime();
  });
  const counts = new Map<ThemeId, number>();
  let taggedEntries = 0;
  for (const record of eligible) {
    if (!record.selectedThemes.length) continue;
    taggedEntries++;
    for (const theme of new Set(record.selectedThemes)) counts.set(theme, (counts.get(theme) ?? 0) + 1);
  }
  return [...counts.entries()].map(([theme, count]) => ({ theme, count, proportionOfTaggedEntries: taggedEntries ? count / taggedEntries : 0 }))
    .sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme));
}

export function computeLoggingPattern(records: readonly CheckInRecord[], now = new Date(), windowDays = 28): LoggingPattern {
  const lower = now.getTime() - Math.max(1, Math.min(180, windowDays)) * 86_400_000;
  const eligible = records.flatMap((record) => {
    const at = parseIso(record.createdAt);
    return record.aggregateConsent && at && at.getTime() >= lower && at.getTime() <= now.getTime() ? [{ record, at }] : [];
  });
  const dates = new Set(eligible.map(({ at }) => at.toISOString().slice(0, 10)));
  const weekdayCounts = new Map<number, number>();
  for (const { at } of eligible) {
    const utcDay = at.getUTCDay();
    const weekday = utcDay === 0 ? 7 : utcDay;
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
  }
  return {
    windowDays: Math.max(1, Math.min(180, windowDays)), distinctLoggingDays: dates.size,
    totalEntries: eligible.length, averageEntriesPerLoggingDay: dates.size ? eligible.length / dates.size : 0,
    weekdayCounts: [...weekdayCounts.entries()].map(([weekday, count]) => ({ weekday, count })).sort((a, b) => a.weekday - b.weekday),
    note: 'Logging frequency describes app entries only; it is not a measure of wellbeing or symptoms.',
  };
}

export function findDuplicateCheckInIds(records: readonly CheckInRecord[]): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const record of records) {
    if (seen.has(record.id)) duplicates.add(record.id);
    seen.add(record.id);
  }
  return [...duplicates];
}
