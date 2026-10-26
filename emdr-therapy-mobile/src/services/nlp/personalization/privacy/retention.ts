import type { PersonalizationRepository } from '../store/contracts.ts';
import type { CheckInRecord, ActivityFeedbackRecord, PersonalizationEvent, ThemeCount } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface RetentionResult {
  readonly checkInsRemoved: number;
  readonly feedbackRemoved: number;
  readonly eventsRemoved: number;
  readonly themeCountsRemoved: number;
}

function keepRecent<T extends { readonly createdAt: string }>(records: readonly T[], cutoff: number, now: number): T[] {
  return records.filter((record) => {
    const time = parseIso(record.createdAt)?.getTime();
    return typeof time === 'number' && time >= cutoff && time <= now;
  });
}

/** Retention is a user setting. Malformed dates are dropped rather than kept indefinitely. */
export async function applyRetention(repository: PersonalizationRepository, retentionDays: number, now = new Date()): Promise<RetentionResult> {
  const days = Math.max(7, Math.min(730, Math.floor(retentionDays)));
  const cutoff = now.getTime() - days * 86_400_000;
  const [checkIns, feedback, events, themes] = await Promise.all([
    repository.listCheckIns(), repository.listActivityFeedback(), repository.listEvents(), repository.listThemeCounts(),
  ]);
  const nextCheckIns = keepRecent<CheckInRecord>(checkIns, cutoff, now.getTime());
  const nextFeedback = keepRecent<ActivityFeedbackRecord>(feedback, cutoff, now.getTime());
  const nextEvents = keepRecent<PersonalizationEvent>(events, cutoff, now.getTime());
  const nextThemes = themes.filter((item) => {
    const time = item.updatedAt ? parseIso(item.updatedAt)?.getTime() : undefined;
    return typeof time === 'number' && time >= cutoff && time <= now.getTime() && !!item.day;
  });
  await Promise.all([
    repository.replaceCheckIns(nextCheckIns),
    repository.replaceActivityFeedback(nextFeedback),
    repository.replaceEvents(nextEvents),
    repository.writeThemeCounts(nextThemes),
  ]);
  return {
    checkInsRemoved: checkIns.length - nextCheckIns.length,
    feedbackRemoved: feedback.length - nextFeedback.length,
    eventsRemoved: events.length - nextEvents.length,
    themeCountsRemoved: themes.length - nextThemes.length,
  };
}

export async function clearAggregateThemeCounts(repository: PersonalizationRepository): Promise<void> {
  await repository.writeThemeCounts([]);
}

export async function clearCheckInHistory(repository: PersonalizationRepository): Promise<void> {
  await repository.replaceCheckIns([]);
}

export async function clearActivityFeedback(repository: PersonalizationRepository): Promise<void> {
  await repository.replaceActivityFeedback([]);
}
