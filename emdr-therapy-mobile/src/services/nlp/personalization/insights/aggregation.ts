import type { CheckInRecord, ThemeId } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface DayAggregate {
  readonly day: string;
  readonly checkInCount: number;
  readonly ratingCount: number;
  readonly ratingSum: number;
  readonly themeCounts: Readonly<Partial<Record<ThemeId, number>>>;
}

export interface AggregateWindow {
  readonly start: string;
  readonly end: string;
  readonly days: readonly DayAggregate[];
  readonly totalEntries: number;
  readonly ratingCount: number;
  readonly themeCounts: Readonly<Partial<Record<ThemeId, number>>>;
}

/** Aggregate date-level counts only; this data structure contains neither notes nor message text. */
export function aggregateCheckIns(records: readonly CheckInRecord[], options: { readonly start: Date; readonly end: Date }): AggregateWindow {
  const start = options.start.getTime();
  const end = options.end.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error('Invalid aggregate window');
  const map = new Map<string, { checkInCount: number; ratingCount: number; ratingSum: number; themeCounts: Partial<Record<ThemeId, number>> }>();
  for (const record of records) {
    if (!record.aggregateConsent) continue;
    const time = parseIso(record.createdAt);
    if (!time || time.getTime() < start || time.getTime() > end) continue;
    const day = time.toISOString().slice(0, 10);
    const current = map.get(day) ?? { checkInCount: 0, ratingCount: 0, ratingSum: 0, themeCounts: {} };
    current.checkInCount++;
    if (typeof record.settlednessRating === 'number' && Number.isFinite(record.settlednessRating) && record.settlednessRating >= 0 && record.settlednessRating <= 10) {
      current.ratingCount++;
      current.ratingSum += record.settlednessRating;
    }
    for (const theme of new Set(record.selectedThemes)) current.themeCounts[theme] = (current.themeCounts[theme] ?? 0) + 1;
    map.set(day, current);
  }
  const days: DayAggregate[] = [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, aggregate]) => ({ day, ...aggregate }));
  const themeCounts: Partial<Record<ThemeId, number>> = {};
  for (const day of days) for (const [theme, count] of Object.entries(day.themeCounts) as [ThemeId, number][]) themeCounts[theme] = (themeCounts[theme] ?? 0) + count;
  return {
    start: options.start.toISOString(), end: options.end.toISOString(), days,
    totalEntries: days.reduce((sum, item) => sum + item.checkInCount, 0),
    ratingCount: days.reduce((sum, item) => sum + item.ratingCount, 0), themeCounts,
  };
}

export function suppressSmallDayAggregates(window: AggregateWindow, minimumCount = 5): AggregateWindow {
  const days = window.days.filter((day) => day.checkInCount >= minimumCount);
  const themeCounts: Partial<Record<ThemeId, number>> = {};
  for (const day of days) for (const [theme, count] of Object.entries(day.themeCounts) as [ThemeId, number][]) themeCounts[theme] = (themeCounts[theme] ?? 0) + count;
  return { ...window, days, totalEntries: days.reduce((sum, day) => sum + day.checkInCount, 0),
    ratingCount: days.reduce((sum, day) => sum + day.ratingCount, 0), themeCounts };
}
