import type { SupportToolId } from '../core/types.ts';

export interface RankingExample {
  readonly ranking: readonly SupportToolId[];
  readonly relevant: readonly SupportToolId[];
}

export interface RankingMetrics {
  readonly exampleCount: number;
  readonly precisionAtOne: number;
  readonly recallAtThree: number;
  readonly meanReciprocalRank: number;
  readonly normalizedDiscountedCumulativeGainAtThree: number;
  readonly catalogCoverage: number;
  readonly duplicateRate: number;
}

function dcg(ranking: readonly SupportToolId[], relevant: ReadonlySet<SupportToolId>, k: number): number {
  return ranking.slice(0, k).reduce((sum, id, index) => sum + (relevant.has(id) ? 1 / Math.log2(index + 2) : 0), 0);
}

export function evaluateRanking(examples: readonly RankingExample[], catalog: readonly SupportToolId[]): RankingMetrics {
  if (!examples.length) return { exampleCount: 0, precisionAtOne: 0, recallAtThree: 0, meanReciprocalRank: 0,
    normalizedDiscountedCumulativeGainAtThree: 0, catalogCoverage: 0, duplicateRate: 0 };
  let p1 = 0; let recall3 = 0; let mrr = 0; let ndcg = 0; let duplicateCount = 0;
  const observed = new Set<SupportToolId>();
  for (const example of examples) {
    const relevant = new Set(example.relevant);
    if (relevant.size && relevant.has(example.ranking[0])) p1++;
    if (relevant.size) recall3 += example.ranking.slice(0, 3).filter((id) => relevant.has(id)).length / relevant.size;
    const firstRelevant = example.ranking.findIndex((id) => relevant.has(id));
    if (firstRelevant >= 0) mrr += 1 / (firstRelevant + 1);
    const ideal = [...relevant].slice(0, 3);
    const idealDcg = ideal.reduce((sum, _, index) => sum + 1 / Math.log2(index + 2), 0);
    if (idealDcg) ndcg += dcg(example.ranking, relevant, 3) / idealDcg;
    if (new Set(example.ranking).size !== example.ranking.length) duplicateCount++;
    for (const id of example.ranking) observed.add(id);
  }
  return {
    exampleCount: examples.length, precisionAtOne: p1 / examples.length, recallAtThree: recall3 / examples.length,
    meanReciprocalRank: mrr / examples.length, normalizedDiscountedCumulativeGainAtThree: ndcg / examples.length,
    catalogCoverage: catalog.length ? [...observed].filter((id) => catalog.includes(id)).length / catalog.length : 0,
    duplicateRate: duplicateCount / examples.length,
  };
}

export function hasAcceptableRankingQuality(metrics: RankingMetrics, thresholds: Partial<Pick<RankingMetrics, 'duplicateRate' | 'catalogCoverage'>> = {}): boolean {
  return metrics.duplicateRate <= (thresholds.duplicateRate ?? 0.05)
    && metrics.catalogCoverage >= (thresholds.catalogCoverage ?? 0.25);
}

export function evaluateSelectionBias(examples: readonly RankingExample[]): { readonly examples: number; readonly noRelevantExamples: number; readonly averageRelevantCount: number } {
  return {
    examples: examples.length,
    noRelevantExamples: examples.filter((item) => item.relevant.length === 0).length,
    averageRelevantCount: examples.length ? examples.reduce((sum, item) => sum + new Set(item.relevant).size, 0) / examples.length : 0,
  };
}
