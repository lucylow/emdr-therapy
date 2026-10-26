export interface ConfidenceSample { confidence: number; correct: boolean; }
export interface ConfidenceBucket { lower: number; upper: number; total: number; accuracy: number; meanConfidence: number; }
export interface CalibrationReport { total: number; brierScore: number; expectedCalibrationError: number; overconfidentErrors: number; buckets: ConfidenceBucket[]; }

/** Evaluates intent confidence against labeled examples; does not calibrate risk or diagnosis. */
export function evaluateConfidenceCalibration(samples: ConfidenceSample[], bucketCount = 10): CalibrationReport {
  const valid = samples.filter((sample) => Number.isFinite(sample.confidence)).map((sample) => ({ confidence: clamp01(sample.confidence), correct: sample.correct === true }));
  const bucketsN = Math.max(2, Math.min(20, Math.floor(bucketCount)));
  const buckets: ConfidenceBucket[] = [];
  for (let index = 0; index < bucketsN; index++) {
    const lower = index / bucketsN;
    const upper = (index + 1) / bucketsN;
    const members = valid.filter((sample) => sample.confidence >= lower && (index === bucketsN - 1 ? sample.confidence <= upper : sample.confidence < upper));
    const total = members.length;
    const accuracy = total ? members.filter((sample) => sample.correct).length / total : 0;
    const meanConfidence = total ? members.reduce((sum, sample) => sum + sample.confidence, 0) / total : 0;
    buckets.push({ lower, upper, total, accuracy: round4(accuracy), meanConfidence: round4(meanConfidence) });
  }
  const total = valid.length;
  const brierScore = total ? valid.reduce((sum, sample) => sum + (sample.confidence - (sample.correct ? 1 : 0)) ** 2, 0) / total : 0;
  const expectedCalibrationError = total ? buckets.reduce((sum, bucket) => sum + (bucket.total / total) * Math.abs(bucket.accuracy - bucket.meanConfidence), 0) : 0;
  const overconfidentErrors = valid.filter((sample) => !sample.correct && sample.confidence >= 0.8).length;
  return { total, brierScore: round4(brierScore), expectedCalibrationError: round4(expectedCalibrationError), overconfidentErrors, buckets };
}
function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function round4(value: number): number { return Number(value.toFixed(4)); }
