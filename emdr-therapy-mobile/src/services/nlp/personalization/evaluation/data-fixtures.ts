import type { ActivityFeedbackRecord, CheckInRecord, SupportToolId, ThemeId } from '../core/types.ts';

export interface InsightFixture {
  readonly id: string;
  readonly description: string;
  readonly optedIn: boolean;
  readonly ratings: readonly number[];
  readonly expectedMinCards: number;
  readonly expectedMaxCards: number;
}

/** Reviewed, synthetic fixtures. These are software tests, not representative clinical data. */
export const INSIGHT_FIXTURES: readonly InsightFixture[] = [
  { id: 'empty', description: 'No recorded information', optedIn: true, ratings: [], expectedMinCards: 0, expectedMaxCards: 0 },
  { id: 'consent-off', description: 'Entries exist but aggregate opt-in is disabled', optedIn: false, ratings: [3, 4, 5, 4, 5, 4], expectedMinCards: 0, expectedMaxCards: 0 },
  { id: 'single-entry', description: 'A single entry cannot support a trend', optedIn: true, ratings: [5], expectedMinCards: 0, expectedMaxCards: 0 },
  { id: 'few-entries', description: 'Below minimum sample threshold', optedIn: true, ratings: [5, 6, 4, 7], expectedMinCards: 0, expectedMaxCards: 1 },
  { id: 'six-stable', description: 'Six user ratings with little variation', optedIn: true, ratings: [5, 5, 5, 5, 5, 5], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'rising-synthetic', description: 'Rising numeric series does not imply causality', optedIn: true, ratings: [2, 3, 4, 5, 6, 7, 8, 8], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'falling-synthetic', description: 'Falling numeric series should still be descriptive only', optedIn: true, ratings: [8, 7, 6, 5, 4, 3, 2, 2], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'wide-variance', description: 'Variable entries should not be forced into a simple narrative', optedIn: true, ratings: [2, 9, 3, 8, 1, 10, 4, 7], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'all-zero', description: 'Minimum-bound values remain numeric data only', optedIn: true, ratings: [0, 0, 0, 0, 0, 0], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'all-ten', description: 'Maximum-bound values remain numeric data only', optedIn: true, ratings: [10, 10, 10, 10, 10, 10], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'nonconsented-mixed', description: 'Opted-out records are excluded', optedIn: true, ratings: [1, 2, 3, 8, 9, 10], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'repeated-values', description: 'Repeated check-in values remain deterministic', optedIn: true, ratings: [4, 4, 4, 4, 4, 4, 4], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'middle-missing', description: 'Missing ratings are not coerced to zero', optedIn: true, ratings: [2, 3, 4, 6, 7, 8], expectedMinCards: 0, expectedMaxCards: 4 },
  { id: 'long-run', description: 'Long runs remain bounded by history settings', optedIn: true, ratings: Array.from({ length: 60 }, (_, i) => i % 11).map((n) => Math.min(10, n)), expectedMinCards: 0, expectedMaxCards: 5 },
  { id: 'same-day', description: 'Many entries on one day must not masquerade as longitudinal coverage', optedIn: true, ratings: [1, 2, 3, 4, 5, 6, 7], expectedMinCards: 0, expectedMaxCards: 3 },
];

export function syntheticCheckIns(input: {
  readonly ratings: readonly number[];
  readonly start?: string;
  readonly stepDays?: number;
  readonly optedIn?: boolean;
  readonly themes?: readonly ThemeId[];
}): readonly CheckInRecord[] {
  const start = new Date(input.start ?? '2026-01-01T12:00:00.000Z');
  const step = input.stepDays ?? 4;
  return input.ratings.map((rating, index) => ({
    id: `fixture-${index + 1}`,
    createdAt: new Date(start.getTime() + index * step * 86_400_000).toISOString(),
    phase: 'standalone' as const,
    settlednessRating: rating,
    selectedThemes: [...(input.themes ?? [])],
    aggregateConsent: input.optedIn ?? true,
  }));
}

export function syntheticFeedback(input: { readonly activityId: SupportToolId; readonly ratings: readonly number[]; readonly start?: string; readonly spacingHours?: number }): readonly ActivityFeedbackRecord[] {
  const start = new Date(input.start ?? '2026-01-01T12:00:00.000Z');
  const step = input.spacingHours ?? 24;
  return input.ratings.map((rating, index) => ({
    id: `feedback-fixture-${index + 1}`, createdAt: new Date(start.getTime() + index * step * 3_600_000).toISOString(),
    activityId: input.activityId, helpfulness: Math.min(5, Math.max(1, Math.round(rating))) as 1 | 2 | 3 | 4 | 5,
    source: 'explicit-rating' as const,
  }));
}
