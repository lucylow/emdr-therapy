export interface ConfidenceSample { confidence: number; correct: boolean; }
export interface CalibrationBin { lowerBound: number; upperBound: number; count: number; meanConfidence: number; observedAccuracy: number; }
export interface CalibrationReport { expectedCalibrationError: number; brierScore: number; bins: CalibrationBin[]; }

/** Confidence diagnostics are for engineering evaluation, not probabilities of clinical truth. */
export function evaluateCalibration(samples: ConfidenceSample[], requestedBins = 10): CalibrationReport {
  const binCount = Math.max(1, Math.min(20, Math.floor(requestedBins)));
  const rows = samples.map((sample) => ({ confidence: Math.max(0, Math.min(1, Number(sample.confidence) || 0)), correct: Boolean(sample.correct) }));
  const bins: CalibrationBin[] = [];
  let ece = 0;
  let brier = 0;
  for (let index = 0; index < binCount; index += 1) {
    const lowerBound = index / binCount;
    const upperBound = (index + 1) / binCount;
    const bucket = rows.filter((row) => row.confidence >= lowerBound && (index === binCount - 1 ? row.confidence <= upperBound : row.confidence < upperBound));
    const meanConfidence = bucket.length ? bucket.reduce((sum, row) => sum + row.confidence, 0) / bucket.length : 0;
    const observedAccuracy = bucket.length ? bucket.filter((row) => row.correct).length / bucket.length : 0;
    if (rows.length) ece += bucket.length / rows.length * Math.abs(meanConfidence - observedAccuracy);
    bins.push({ lowerBound, upperBound, count: bucket.length, meanConfidence, observedAccuracy });
  }
  if (rows.length) brier = rows.reduce((sum, row) => sum + (row.confidence - Number(row.correct)) ** 2, 0) / rows.length;
  return { expectedCalibrationError: ece, brierScore: brier, bins };
}
