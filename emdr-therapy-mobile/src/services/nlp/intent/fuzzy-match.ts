import { normalizeForMatching } from '../text/normalize-base.ts';

export interface FuzzyMatch { matched: boolean; similarity: number; distance: number; }

/** Damerau-free Levenshtein distance; inputs are deliberately capped for mobile performance. */
export function editDistance(left: string, right: string): number {
  const a = normalizeForMatching(left).slice(0, 80);
  const b = normalizeForMatching(right).slice(0, 80);
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  let current = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
    current = new Array<number>(b.length + 1).fill(0);
  }
  return previous[b.length];
}

export function fuzzyPhraseMatch(input: string, phrase: string): FuzzyMatch {
  const left = normalizeForMatching(input).split(/\s+/u).filter(Boolean);
  const right = normalizeForMatching(phrase).split(/\s+/u).filter(Boolean);
  if (left.length === 0 || right.length === 0 || right.length > 6) return { matched: false, similarity: 0, distance: Number.POSITIVE_INFINITY };
  let bestDistance = Number.POSITIVE_INFINITY;
  const windowSizes = new Set([Math.max(1, right.length - 1), right.length, right.length + 1]);
  for (const size of windowSizes) {
    for (let start = 0; start <= left.length - size; start += 1) {
      const candidate = left.slice(start, start + size);
      if (Math.abs(candidate.length - right.length) > 1) continue;
      let distance = 0;
      const shared = Math.min(candidate.length, right.length);
      for (let i = 0; i < shared; i += 1) {
        const max = right[i].length >= 8 ? 2 : right[i].length >= 4 ? 1 : 0;
        const itemDistance = editDistance(candidate[i], right[i]);
        if (itemDistance > max) { distance += max + 2; continue; }
        distance += itemDistance;
      }
      distance += Math.abs(candidate.length - right.length) * 2;
      bestDistance = Math.min(bestDistance, distance);
    }
  }
  const denominator = Math.max(1, right.reduce((sum, word) => sum + word.length, 0));
  const similarity = Math.max(0, 1 - bestDistance / denominator);
  // Do not fuzzy-match short control words; stop/pause must remain deterministic.
  const matched = bestDistance <= Math.max(1, Math.floor(right.length / 2)) && similarity >= 0.72;
  return { matched, similarity: Number(similarity.toFixed(3)), distance: bestDistance };
}
