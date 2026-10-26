import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import type { ActivityRecommendation, SupportToolId } from '../core/types.ts';
import { evidenceWeight } from '../profile/decay.ts';
import { getActivityDefinition, type SupportActivityDefinition } from './catalog.ts';
import type { PreparedRecommendationContext } from './context.ts';

export interface ScoringWeights {
  readonly explicitPreference: number;
  readonly historicalHelpfulness: number;
  readonly themeMatch: number;
  readonly accessibilityMatch: number;
  readonly novelty: number;
  readonly skipPenalty: number;
}
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = Object.freeze({
  explicitPreference: 30, historicalHelpfulness: 25, themeMatch: 12,
  accessibilityMatch: 10, novelty: 3, skipPenalty: 35,
});

export interface ScoredCandidate {
  readonly activityId: SupportToolId;
  readonly score: number;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly caveats: readonly string[];
  readonly evidenceCount: number;
  readonly definition: SupportActivityDefinition;
}

export function scoreCandidate(id: SupportToolId, context: PreparedRecommendationContext, weights = DEFAULT_SCORING_WEIGHTS): ScoredCandidate | undefined {
  const definition = getActivityDefinition(id);
  if (!definition || id === 'none' || !definition.defaultEnabled || !context.candidateIds.includes(id)) return undefined;
  if (context.explicitAvoidList.has(id)) return undefined;
  if (definition.requiresMotion && context.reducedMotion) return undefined;
  if (definition.usesAudio && !context.soundEnabled) return undefined;
  const reasons: string[] = [];
  const caveats: string[] = [definition.safetyNote];
  let score = 20;
  const explicitPreferred = context.explicitPreferredIds.has(id);
  if (explicitPreferred) { score += weights.explicitPreference; reasons.push('matches a preference you chose or confirmed'); }
  // Only explicit count/rating summaries are used; raw journal/chat text is not an input.
  const known = context.feedbackSummary.tools.find((item) => item.activityId === id);
  if (known && context.learningEnabled && known.count >= PERSONALIZATION_LIMITS.minRecommendationEvidence) {
    const normalized = Math.max(0, Math.min(1, (known.weightedMean - 1) / 4));
    score += normalized * weights.historicalHelpfulness;
    reasons.push('based on your optional feedback');
  } else {
    score += weights.novelty;
    reasons.push('a general option to explore');
  }
  const themeHits = definition.themeMatches.filter((theme) => context.selectedThemes.has(theme)).length;
  if (themeHits > 0) { score += Math.min(weights.themeMatch, themeHits * 5); reasons.push('fits a topic you selected'); }
  if (context.reducedMotion && !definition.requiresMotion) { score += weights.accessibilityMatch; reasons.push('does not require animated movement'); }
  if (context.frequentlySkipped.has(id)) { score -= weights.skipPenalty; caveats.push('You have often skipped or rated this option low; it may be better to leave it out.'); }
  const clippedScore = Math.max(0, Math.min(PERSONALIZATION_LIMITS.maxScore, score));
  const confidence = known && known.count >= PERSONALIZATION_LIMITS.minRecommendationEvidence
    ? Math.min(0.86, 0.3 + known.count / 12)
    : 0.25;
  return { activityId: id, score: clippedScore, confidence, reasons, caveats, evidenceCount: known?.count ?? 0, definition };
}

export function recommendCandidates(context: PreparedRecommendationContext, limit = 3, weights = DEFAULT_SCORING_WEIGHTS): readonly ScoredCandidate[] {
  const max = Math.max(0, Math.min(PERSONALIZATION_LIMITS.maxRecommendations, Math.floor(limit)));
  return context.candidateIds.map((id) => scoreCandidate(id, context, weights)).filter((value): value is ScoredCandidate => !!value)
    .sort((a, b) => b.score - a.score || a.activityId.localeCompare(b.activityId)).slice(0, max);
}

export function toRecommendation(candidate: ScoredCandidate): ActivityRecommendation {
  return { activityId: candidate.activityId, score: candidate.score, confidence: candidate.confidence,
    reasons: candidate.reasons, caveats: candidate.caveats, requiresExplicitSelection: true };
}
