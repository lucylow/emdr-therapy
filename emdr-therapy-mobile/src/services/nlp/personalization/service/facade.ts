import type { Clock } from '../core/time.ts';
import { systemClock } from '../core/time.ts';
import type { ProfileSnapshot, RecommendationContext, SupportToolId, LocalDataBundle, ActivityFeedbackRecord } from '../core/types.ts';
import type { KeyValueStore, PersonalizationRepository } from '../store/contracts.ts';
import { LocalPersonalizationRepository } from '../store/repository.ts';
import { ProfileService } from '../profile/service.ts';
import { CheckInService, type CheckInInput } from '../checkins/service.ts';
import { RecommendationFeedbackService } from '../recommendations/feedback.ts';
import { InsightsService } from '../insights/service.ts';
import { exportLocalData, importLocalData, type BundleValidation } from '../privacy/export.ts';
import { deleteAllLocalPersonalizationData } from '../privacy/wipe.ts';
import { getPersonalizedRecommendations } from '../recommendations/service.ts';
import { decideFeature } from './feature-policy.ts';

export interface PersonalizationKit {
  readonly repository: PersonalizationRepository;
  readonly profile: ProfileService;
  readonly checkIns: CheckInService;
  readonly feedback: RecommendationFeedbackService;
  readonly insights: InsightsService;
  getProfile(): Promise<ProfileSnapshot>;
  getRecommendations(context: RecommendationContext): Promise<ReturnType<typeof getPersonalizedRecommendations>>;
  saveCheckIn(input: CheckInInput): Promise<Awaited<ReturnType<CheckInService['save']>>>;
  recordToolRating(activityId: SupportToolId, rating: 1 | 2 | 3 | 4 | 5): Promise<ActivityFeedbackRecord>;
  exportData(): Promise<LocalDataBundle | undefined>;
  importData(bundle: unknown, mode: 'merge' | 'replace'): Promise<BundleValidation>;
  clearAllData(confirmation: string): Promise<Awaited<ReturnType<typeof deleteAllLocalPersonalizationData>>>;
}

/** Factory for app integration. Use one instance per locally stored profile, not per render. */
export function createPersonalizationKit(input: {
  readonly profileId: string;
  readonly keyValueStore: KeyValueStore;
  readonly clock?: Clock;
}): PersonalizationKit {
  const clock = input.clock ?? systemClock;
  const repository = new LocalPersonalizationRepository(input.keyValueStore);
  const profile = new ProfileService({ profileId: input.profileId, repository, clock });
  const checkIns = new CheckInService({
    repository,
    clock,
    isAggregateInsightsEnabled: async () => (await profile.getOrCreate()).settings.insightsEnabled,
  });
  const feedback = new RecommendationFeedbackService({
    repository,
    clock,
    isLearningEnabled: async () => {
      const settings = (await profile.getOrCreate()).settings;
      return settings.personalizationEnabled && settings.usageLearningEnabled;
    },
  });
  const insights = new InsightsService({ repository, getProfile: () => profile.getOrCreate(), clock: () => clock.now() });

  return {
    repository, profile, checkIns, feedback, insights,
    getProfile: () => profile.getOrCreate(),
    getRecommendations: async (context) => {
      const current = await profile.getOrCreate();
      const decision = decideFeature('personalized-recommendations', current.settings, current.settings.usageLearningEnabled);
      return getPersonalizedRecommendations({
        context, enabled: decision.allowed,
        profile: { preferences: current.preferences, feedback: await repository.listActivityFeedback(), learningEnabled: decision.allowed },
      });
    },
    saveCheckIn: (value) => checkIns.save(value),
    recordToolRating: (activityId, rating) => feedback.rate(activityId, rating),
    exportData: () => exportLocalData(repository),
    importData: (bundle, mode) => importLocalData(repository, bundle, mode),
    clearAllData: (confirmation) => deleteAllLocalPersonalizationData(repository, confirmation),
  };
}
