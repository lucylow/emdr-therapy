import type { ChatEvaluationRow } from '../types.ts';

export interface ConfusionCell { expected: string; predicted: string; count: number; }
export interface IntentMetrics { intent: string; support: number; predicted: number; truePositive: number; precision: number; recall: number; f1: number; }
export interface ConfusionMatrixReport {
  total: number;
  accuracy: number;
  labels: string[];
  cells: ConfusionCell[];
  perIntent: IntentMetrics[];
}

export function createConfusionMatrix(rows: ChatEvaluationRow[]): ConfusionMatrixReport {
  const labels = [...new Set(rows.flatMap((row) => [row.expected, row.predicted]))].sort();
  const count = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.expected}\u0000${row.predicted}`;
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const cells = [...count.entries()].map(([key, value]) => {
    const [expected = '', predicted = ''] = key.split('\u0000');
    return { expected, predicted, count: value };
  }).sort((a, b) => a.expected.localeCompare(b.expected) || a.predicted.localeCompare(b.predicted));
  const perIntent = labels.map((intent) => {
    const support = rows.filter((row) => row.expected === intent).length;
    const predicted = rows.filter((row) => row.predicted === intent).length;
    const truePositive = rows.filter((row) => row.expected === intent && row.predicted === intent).length;
    const precision = predicted ? truePositive / predicted : 0;
    const recall = support ? truePositive / support : 0;
    const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
    return { intent, support, predicted, truePositive, precision: round4(precision), recall: round4(recall), f1: round4(f1) };
  });
  const correct = rows.filter((row) => row.correct).length;
  return { total: rows.length, accuracy: rows.length ? round4(correct / rows.length) : 0, labels, cells, perIntent };
}

export function formatConfusionMatrix(report: ConfusionMatrixReport): string {
  const header = ['intent', ...report.labels].join('\t');
  const lines = [header];
  for (const expected of report.labels) {
    const values = report.labels.map((predicted) => report.cells.find((cell) => cell.expected === expected && cell.predicted === predicted)?.count ?? 0);
    lines.push([expected, ...values].join('\t'));
  }
  return lines.join('\n');
}
function round4(value: number): number { return Number(value.toFixed(4)); }
