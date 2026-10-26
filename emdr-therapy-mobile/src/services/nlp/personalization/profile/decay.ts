import { dayDifference, parseIso } from '../core/time.ts';

export interface EvidenceWeightInput {
  readonly observedAt: string;
  readonly now: Date;
  readonly halfLifeDays?: number;
  readonly initialWeight?: number;
}

/** Exponential decay is a ranking heuristic only; it is not evidence of a person changing. */
export function evidenceWeight(input: EvidenceWeightInput): number {
  const timestamp = parseIso(input.observedAt);
  if (!timestamp || timestamp.getTime() > input.now.getTime()) return 0;
  const age = Math.max(0, dayDifference(input.now, timestamp));
  const halfLife = Math.max(1, input.halfLifeDays ?? 60);
  const initial = Math.max(0, Math.min(1, input.initialWeight ?? 1));
  return initial * Math.pow(0.5, age / halfLife);
}

export function confidenceFromEvidence(count: number, averageWeight: number, cap = 0.94): number {
  if (!Number.isFinite(count) || count <= 0 || !Number.isFinite(averageWeight) || averageWeight <= 0) return 0;
  const raw = (1 - Math.exp(-count / 4)) * Math.min(1, averageWeight);
  return Math.max(0, Math.min(cap, raw));
}

export function ageBucket(timestamp: string, now: Date): 'recent' | 'older' | 'stale' | 'invalid' {
  const date = parseIso(timestamp);
  if (!date || date.getTime() > now.getTime()) return 'invalid';
  const days = dayDifference(now, date);
  if (days <= 14) return 'recent';
  if (days <= 60) return 'older';
  return 'stale';
}

export function weightedAverage(values: readonly { value: number; at: string }[], now: Date, halfLifeDays = 60): number | undefined {
  const pairs = values.map((entry) => ({ ...entry, weight: evidenceWeight({ observedAt: entry.at, now, halfLifeDays }) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.weight > 0);
  const denominator = pairs.reduce((sum, entry) => sum + entry.weight, 0);
  if (denominator <= 0) return undefined;
  return pairs.reduce((sum, entry) => sum + entry.value * entry.weight, 0) / denominator;
}
