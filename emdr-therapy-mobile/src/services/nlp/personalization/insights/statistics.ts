/** Deterministic descriptive statistics. No significance tests or clinical classifications. */
export interface NumericSummary {
  readonly count: number;
  readonly mean: number;
  readonly median: number;
  readonly min: number;
  readonly max: number;
  readonly range: number;
  readonly standardDeviation: number;
  readonly first: number;
  readonly last: number;
  readonly delta: number;
}

export function cleanNumbers(values: readonly unknown[]): number[] {
  return values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

export function sum(values: readonly number[]): number { return values.reduce((acc, value) => acc + value, 0); }

export function mean(values: readonly number[]): number | undefined {
  const clean = cleanNumbers(values);
  return clean.length ? sum(clean) / clean.length : undefined;
}

export function median(values: readonly number[]): number | undefined {
  const clean = cleanNumbers(values).sort((a, b) => a - b);
  if (!clean.length) return undefined;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

export function percentile(values: readonly number[], p: number): number | undefined {
  const clean = cleanNumbers(values).sort((a, b) => a - b);
  if (!clean.length || !Number.isFinite(p) || p < 0 || p > 1) return undefined;
  const index = (clean.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return clean[lower] + (clean[upper] - clean[lower]) * (index - lower);
}

export function variance(values: readonly number[], sample = false): number | undefined {
  const clean = cleanNumbers(values);
  const center = mean(clean);
  const divisor = clean.length - (sample ? 1 : 0);
  if (center === undefined || divisor <= 0) return undefined;
  return sum(clean.map((value) => (value - center) ** 2)) / divisor;
}

export function standardDeviation(values: readonly number[]): number | undefined {
  const value = variance(values);
  return value === undefined ? undefined : Math.sqrt(value);
}

export function summarize(values: readonly number[]): NumericSummary | undefined {
  const clean = cleanNumbers(values);
  const average = mean(clean);
  const middle = median(clean);
  const deviation = standardDeviation(clean);
  if (!clean.length || average === undefined || middle === undefined || deviation === undefined) return undefined;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  return {
    count: clean.length, mean: average, median: middle, min, max, range: max - min,
    standardDeviation: deviation, first: clean[0], last: clean[clean.length - 1], delta: clean[clean.length - 1] - clean[0],
  };
}

export function histogram(values: readonly number[], min = 0, max = 10, bucketCount = 5): readonly number[] {
  const buckets = Math.max(1, Math.min(20, Math.floor(bucketCount)));
  const counts = Array.from({ length: buckets }, () => 0);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return counts;
  for (const value of cleanNumbers(values)) {
    if (value < min || value > max) continue;
    const index = value === max ? buckets - 1 : Math.floor(((value - min) / (max - min)) * buckets);
    counts[index] += 1;
  }
  return counts;
}

export function normalizedHistogram(values: readonly number[], min = 0, max = 10, buckets = 5): readonly number[] {
  const counts = histogram(values, min, max, buckets);
  const total = counts.reduce((a, b) => a + b, 0);
  return total ? counts.map((count) => count / total) : counts;
}

export function movingAverage(values: readonly number[], windowSize: number): readonly (number | undefined)[] {
  const window = Math.max(1, Math.min(100, Math.floor(windowSize)));
  const result: (number | undefined)[] = [];
  const queue: number[] = [];
  for (const value of values) {
    if (Number.isFinite(value)) queue.push(value);
    if (queue.length > window) queue.shift();
    result.push(queue.length === window ? sum(queue) / queue.length : undefined);
  }
  return result;
}

export function pearsonCorrelation(xs: readonly number[], ys: readonly number[]): number | undefined {
  if (xs.length !== ys.length || xs.length < 3) return undefined;
  const pairs = xs.map((x, i) => ({ x, y: ys[i] })).filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y));
  if (pairs.length < 3) return undefined;
  const xMean = mean(pairs.map((p) => p.x));
  const yMean = mean(pairs.map((p) => p.y));
  if (xMean === undefined || yMean === undefined) return undefined;
  const numerator = sum(pairs.map((p) => (p.x - xMean) * (p.y - yMean)));
  const xDenom = sum(pairs.map((p) => (p.x - xMean) ** 2));
  const yDenom = sum(pairs.map((p) => (p.y - yMean) ** 2));
  const denominator = Math.sqrt(xDenom * yDenom);
  if (!denominator) return undefined;
  return Math.max(-1, Math.min(1, numerator / denominator));
}

export function linearSlope(values: readonly number[]): number | undefined {
  const clean = cleanNumbers(values);
  if (clean.length < 3) return undefined;
  const xMean = (clean.length - 1) / 2;
  const yMean = mean(clean);
  if (yMean === undefined) return undefined;
  const numerator = clean.reduce((acc, value, index) => acc + (index - xMean) * (value - yMean), 0);
  const denominator = clean.reduce((acc, _, index) => acc + (index - xMean) ** 2, 0);
  return denominator ? numerator / denominator : undefined;
}
