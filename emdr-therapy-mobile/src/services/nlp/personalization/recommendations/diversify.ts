import type { SupportToolId } from '../core/types.ts';
import type { ScoredCandidate } from './score.ts';

/** Soft diversity: avoid showing multiple options with essentially identical low-demand purposes. */
const SIMILARITY_GROUPS: Readonly<Record<string, readonly SupportToolId[]>> = {
  sensory: ['grounding-5-4-3-2-1', 'orientation-to-room', 'sensory-preferences'],
  pause: ['quiet-pause', 'water-break', 'gentle-stretch'],
  reflection: ['short-reflection', 'kind-self-talk'],
};

function groupFor(id: SupportToolId): string | undefined {
  return Object.entries(SIMILARITY_GROUPS).find(([, ids]) => ids.includes(id))?.[0];
}

export function diversifyRecommendations(candidates: readonly ScoredCandidate[], limit = 3): readonly ScoredCandidate[] {
  const selected: ScoredCandidate[] = [];
  const remaining = [...candidates];
  const usedGroups = new Set<string>();
  while (remaining.length && selected.length < Math.max(0, limit)) {
    let index = remaining.findIndex((candidate) => {
      const group = groupFor(candidate.activityId);
      return !group || !usedGroups.has(group);
    });
    if (index < 0) index = 0; // If all remaining are similar, still allow choices over no choices.
    const [candidate] = remaining.splice(index, 1);
    selected.push(candidate);
    const group = groupFor(candidate.activityId);
    if (group) usedGroups.add(group);
  }
  return selected;
}

export function removeUnavailableCandidates<T extends { activityId: SupportToolId }>(
  candidates: readonly T[], available: readonly SupportToolId[],
): readonly T[] {
  const set = new Set(available);
  return candidates.filter((candidate) => set.has(candidate.activityId));
}
