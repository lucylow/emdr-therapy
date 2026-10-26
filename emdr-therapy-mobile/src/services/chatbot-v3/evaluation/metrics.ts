export interface LabeledExample<L extends string> { expected: L; predicted: L; }
export interface ClassMetrics { label: string; precision: number; recall: number; f1: number; support: number; }
export interface EvaluationSummary { accuracy: number; macroF1: number; total: number; perClass: ClassMetrics[]; confusion: Record<string, Record<string, number>>; }

/** Transparent evaluation helpers for reviewed, consent-free synthetic examples. */
export function evaluateLabels<L extends string>(rows: LabeledExample<L>[], labels?: L[]): EvaluationSummary {
  const classLabels = [...new Set(labels ?? rows.flatMap((row) => [row.expected, row.predicted]))].sort();
  const confusion: Record<string, Record<string, number>> = {};
  for (const expected of classLabels) {
    confusion[expected] = {};
    for (const predicted of classLabels) confusion[expected][predicted] = 0;
  }
  let correct = 0;
  for (const row of rows) {
    if (!confusion[row.expected]) confusion[row.expected] = {};
    confusion[row.expected][row.predicted] = (confusion[row.expected][row.predicted] ?? 0) + 1;
    if (row.expected === row.predicted) correct += 1;
  }
  const perClass = classLabels.map((label) => {
    const tp = confusion[label]?.[label] ?? 0;
    const support = Object.values(confusion[label] ?? {}).reduce((sum, value) => sum + value, 0);
    const predictedTotal = classLabels.reduce((sum, expected) => sum + (confusion[expected]?.[label] ?? 0), 0);
    const precision = predictedTotal ? tp / predictedTotal : 0;
    const recall = support ? tp / support : 0;
    return { label, precision, recall, f1: precision + recall ? 2 * precision * recall / (precision + recall) : 0, support };
  });
  return {
    accuracy: rows.length ? correct / rows.length : 0,
    macroF1: perClass.length ? perClass.reduce((sum, item) => sum + item.f1, 0) / perClass.length : 0,
    total: rows.length,
    perClass,
    confusion,
  };
}

export function assertMinimumSafetyRecall<L extends string>(summary: EvaluationSummary, positiveLabels: L[], minimumRecall = 0.95): void {
  const failures = summary.perClass.filter((item) => positiveLabels.includes(item.label as L) && item.recall < minimumRecall);
  if (failures.length) throw new Error(`Safety evaluation threshold failed: ${failures.map((x) => `${x.label}=${x.recall.toFixed(3)}`).join(', ')}`);
}
