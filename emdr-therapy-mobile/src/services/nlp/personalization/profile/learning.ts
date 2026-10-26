import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { confidenceFromEvidence, weightedAverage } from './decay.ts';
import { createId } from '../core/id.ts';
import type { ActivityFeedbackRecord, PreferenceProposal, SupportToolId } from '../core/types.ts';
import { summarizeActivityFeedback } from './observations.ts';

export interface LearningOptions {
  readonly userEnabledLearning: boolean;
  readonly now?: Date;
  readonly previousProposalIds?: readonly string[];
}

/**
 * Only learns ranking hints from explicit feedback. No implicit tracking, sentiment inference,
 * or clinical state detection is used here. A user-facing proposal must be accepted separately.
 */
export function proposeToolPreferenceLearning(records: readonly ActivityFeedbackRecord[], options: LearningOptions): readonly PreferenceProposal[] {
  if (!options.userEnabledLearning) return [];
  const now = options.now ?? new Date();
  const summary = summarizeActivityFeedback(records, now);
  const previous = new Set(options.previousProposalIds ?? []);
  const candidates = summary.tools.filter((tool) => tool.count >= PERSONALIZATION_LIMITS.minObservedEvidence && tool.rawMean >= 4);
  const proposals: PreferenceProposal[] = [];
  for (const candidate of candidates.slice(0, 3)) {
    const id = `pref-${candidate.activityId}-${candidate.lastSeenAt.slice(0, 10)}`;
    if (previous.has(id)) continue;
    proposals.push({
      id,
      key: 'preferredSupportTools',
      proposedValue: [candidate.activityId],
      confidence: Math.min(PERSONALIZATION_LIMITS.maxPreferenceConfidence, candidate.confidence),
      evidenceCount: candidate.count,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + PERSONALIZATION_LIMITS.maxProposalLifetimeDays * 86_400_000).toISOString(),
      explanationCode: `explicit-ratings-favor:${candidate.activityId}`,
      requiresConfirmation: true,
    });
  }
  return proposals.filter((proposal) => proposal.confidence >= PERSONALIZATION_LIMITS.minPreferenceConfidence);
}

export interface PreferenceSignal {
  readonly key: 'responseLength' | 'suggestionDensity';
  readonly value: string;
  readonly createdAt: string;
  readonly signalSource: 'explicit-ui-action';
}

/**
 * Converts only explicit UI controls into preference proposals. The app must call this after
 * the user changes a real visible control; typing words about the setting is not enough.
 */
export function preferenceProposalFromUiSignal(signal: PreferenceSignal, now = new Date()): PreferenceProposal {
  const confidence = 0.9;
  const id = createId('ui-pref', now);
  return {
    id,
    key: signal.key,
    proposedValue: signal.value,
    confidence,
    evidenceCount: 1,
    createdAt: signal.createdAt,
    expiresAt: new Date(now.getTime() + 14 * 86_400_000).toISOString(),
    explanationCode: 'explicit-ui-control-change',
    requiresConfirmation: true,
  };
}

export function recentToolAverage(records: readonly ActivityFeedbackRecord[], activityId: SupportToolId, now = new Date()): number | undefined {
  const candidates = records.filter((record) => record.activityId === activityId && record.helpfulness >= 1 && record.helpfulness <= 5);
  return weightedAverage(candidates.map((entry) => ({ value: entry.helpfulness, at: entry.createdAt })), now, 60);
}

export function boundedLearningConfidence(evidenceCount: number, averageWeight: number): number {
  return confidenceFromEvidence(evidenceCount, averageWeight, PERSONALIZATION_LIMITS.maxPreferenceConfidence);
}
