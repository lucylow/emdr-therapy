import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import type { CheckInRecord, ThemeId } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface ThemeWindowCount {
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly entryCount: number;
  readonly themeCounts: Readonly<Partial<Record<ThemeId, number>>>;
}

export interface ThemeTimelineResult {
  readonly eligible: boolean;
  readonly reason?: 'not-enough-overall-data' | 'not-enough-data-per-window';
  readonly windows: readonly ThemeWindowCount[];
  readonly note: string;
}

/** Compares how frequently a person selected tags, never why a topic appeared or what it means. */
export function buildThemeTimeline(records: readonly CheckInRecord[], options: {
  readonly enabled: boolean;
  readonly now?: Date;
  readonly windowCount?: number;
  readonly windowDays?: number;
  readonly minimumEntriesPerWindow?: number;
}): ThemeTimelineResult {
  if (!options.enabled) return { eligible: false, reason: 'not-enough-overall-data', windows: [], note: 'Theme timeline is disabled.' };
  const now = options.now ?? new Date();
  const count = Math.max(2, Math.min(8, Math.floor(options.windowCount ?? 4)));
  const windowDays = Math.max(7, Math.min(90, Math.floor(options.windowDays ?? 14)));
  const minimum = Math.max(PERSONALIZATION_LIMITS.minInsightSamples, options.minimumEntriesPerWindow ?? 5);
  const totalDays = count * windowDays;
  const startAll = now.getTime() - totalDays * 86_400_000;
  const eligible = records.flatMap((record) => {
    const at = parseIso(record.createdAt);
    return record.aggregateConsent && at && at.getTime() >= startAll && at.getTime() <= now.getTime() ? [{ record, at }] : [];
  });
  if (eligible.length < minimum * 2) return { eligible: false, reason: 'not-enough-overall-data', windows: [], note: 'More opt-in entries are needed.' };
  const windows: ThemeWindowCount[] = [];
  for (let i = 0; i < count; i++) {
    const end = now.getTime() - (count - i - 1) * windowDays * 86_400_000;
    const start = end - windowDays * 86_400_000;
    const items = eligible.filter(({ at }) => at.getTime() >= start && at.getTime() < end);
    const counts: Partial<Record<ThemeId, number>> = {};
    for (const { record } of items) for (const theme of new Set(record.selectedThemes)) counts[theme] = (counts[theme] ?? 0) + 1;
    windows.push({ windowStart: new Date(start).toISOString(), windowEnd: new Date(end).toISOString(), entryCount: items.length, themeCounts: counts });
  }
  if (windows.some((window) => window.entryCount < minimum)) return { eligible: false, reason: 'not-enough-data-per-window', windows: [], note: 'Each time window needs enough entries; no partial trend is shown.' };
  return { eligible: true, windows, note: 'Counts reflect tags selected by the user. They do not infer causes, symptoms, or future outcomes.' };
}
