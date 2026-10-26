import { prepareRecommendationContext, type RecommendationProfile } from './context.ts';
import { recommendCandidates, toRecommendation } from './score.ts';
import { diversifyRecommendations } from './diversify.ts';
import { explainRecommendation } from './explain.ts';
import type { ActivityRecommendation, LanguageCode, RecommendationContext } from '../core/types.ts';

export interface RecommendationServiceInput {
  readonly context: RecommendationContext;
  readonly profile: RecommendationProfile;
  readonly enabled: boolean;
  readonly limit?: number;
}

export interface RecommendationServiceResult {
  readonly recommendations: readonly ActivityRecommendation[];
  readonly explanations: readonly ReturnType<typeof explainRecommendation>[];
  readonly disabledReason?: 'user-did-not-request' | 'feature-disabled';
}

export function getPersonalizedRecommendations(input: RecommendationServiceInput): RecommendationServiceResult {
  if (!input.enabled) return { recommendations: [], explanations: [], disabledReason: 'feature-disabled' };
  if (!input.context.userRequestedSuggestions) return { recommendations: [], explanations: [], disabledReason: 'user-did-not-request' };
  const prepared = prepareRecommendationContext({ context: input.context, profile: input.profile, now: new Date(input.context.now) });
  const ranked = recommendCandidates(prepared, Math.max(1, Math.min(3, input.limit ?? 3)));
  const diversified = diversifyRecommendations(ranked, input.limit ?? 3);
  const recommendations = diversified.map(toRecommendation);
  return {
    recommendations,
    explanations: recommendations.map((item) => explainRecommendation(item, input.context.language)),
  };
}

export function defaultRecommendationContext(now = new Date(), language: LanguageCode = 'en'): RecommendationContext {
  return {
    now: now.toISOString(), language,
    availableActivityIds: ['quiet-pause', 'grounding-5-4-3-2-1', 'orientation-to-room', 'paced-breathing', 'gentle-stretch', 'sensory-preferences', 'short-reflection', 'kind-self-talk', 'water-break'],
    reducedMotion: false, soundEnabled: false, userRequestedSuggestions: false, explicitAvoidList: [], selectedThemes: [],
  };
}
