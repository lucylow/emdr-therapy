import type { ActivityFeedbackRecord, PreferenceEntry, PreferenceKey, RecommendationContext, SupportToolId } from '../core/types.ts';
import { isWithinDays } from '../core/time.ts';
import { skippedFrequently, summarizeActivityFeedback } from '../profile/observations.ts';

export interface RecommendationProfile {
  readonly preferences: Partial<Record<PreferenceKey, PreferenceEntry>>;
  readonly feedback: readonly ActivityFeedbackRecord[];
  readonly learningEnabled: boolean;
}

export interface PreparedRecommendationContext {
  readonly now: Date;
  readonly language: RecommendationContext['language'];
  readonly candidateIds: readonly SupportToolId[];
  readonly explicitPreferredIds: ReadonlySet<SupportToolId>;
  readonly explicitAvoidList: ReadonlySet<SupportToolId>;
  readonly selectedThemes: ReadonlySet<string>;
  readonly reducedMotion: boolean;
  readonly soundEnabled: boolean;
  readonly learningEnabled: boolean;
  readonly feedbackSummary: ReturnType<typeof summarizeActivityFeedback>;
  readonly frequentlySkipped: ReadonlySet<SupportToolId>;
}

function preferenceValue<T>(profile: RecommendationProfile, key: PreferenceKey, fallback: T): T {
  const entry = profile.preferences[key];
  if (!entry || entry.status !== 'active') return fallback;
  return entry.value as T;
}

export function prepareRecommendationContext(input: {
  readonly context: RecommendationContext;
  readonly profile: RecommendationProfile;
  readonly now?: Date;
}): PreparedRecommendationContext {
  const now = input.now ?? new Date(input.context.now);
  const preferred = preferenceValue<SupportToolId[]>(input.profile, 'preferredSupportTools', []);
  const candidateIds = [...new Set(input.context.availableActivityIds)];
  const explicitPreferredIds = new Set(preferred.filter((id) => input.context.availableActivityIds.includes(id)));
  const summary = input.profile.learningEnabled ? summarizeActivityFeedback(input.profile.feedback, now) : { totalRatings: 0, tools: [], sampleEnoughForSuggestions: false };
  const frequentlySkipped = new Set<SupportToolId>();
  if (input.profile.learningEnabled) {
    for (const id of input.context.availableActivityIds) if (skippedFrequently(input.profile.feedback, id)) frequentlySkipped.add(id);
  }
  // An explicit avoid always wins; feedback must not resurrect an activity the user rejected.
  const explicitAvoidList = new Set(input.context.explicitAvoidList);
  for (const item of summary.tools) if (item.count >= 4 && item.rawMean <= 2) frequentlySkipped.add(item.activityId);
  return {
    now, language: input.context.language, candidateIds, explicitPreferredIds,
    explicitAvoidList, selectedThemes: new Set(input.context.selectedThemes),
    reducedMotion: input.context.reducedMotion || preferenceValue(input.profile, 'reducedMotion', false),
    soundEnabled: input.context.soundEnabled && preferenceValue(input.profile, 'soundEnabled', true),
    learningEnabled: input.profile.learningEnabled, feedbackSummary: summary, frequentlySkipped,
  };
}

export function isFeedbackRecent(record: ActivityFeedbackRecord, now: Date, days = 180): boolean {
  return isWithinDays(record.createdAt, now, days);
}
