import type { Intent, Language, NlpConfig } from '../types.ts';
import { classifyIntent } from '../intent/classifier.ts';

export interface RobustnessExample {
  text: string;
  expected: Intent;
  language: Language;
  slice?: string;
}

export interface RobustnessRow {
  transform: string;
  total: number;
  correct: number;
  accuracy: number;
  errors: Array<{ input: string; expected: Intent; predicted: Intent }>;
}

export interface RobustnessReport {
  totalCases: number;
  transformations: RobustnessRow[];
  lowConfidenceCount: number;
  /** Counts cases where a non-control utterance incorrectly routes to a critical control. */
  criticalControlFalsePositives: number;
  warnings: string[];
}

type TextTransform = { name: string; apply: (text: string) => string };

const TRANSFORMS: TextTransform[] = [
  { name: 'baseline', apply: (text) => text },
  { name: 'lowercase', apply: (text) => text.toLocaleLowerCase('en') },
  { name: 'extra_whitespace', apply: (text) => `  ${text.replace(/\s+/gu, '   ')}  ` },
  { name: 'trailing_punctuation', apply: (text) => `${text}?!` },
  { name: 'balanced_quotes', apply: (text) => `“${text}”` },
];

const CRITICAL = new Set<Intent>(['stop_request', 'pause_request', 'safety_concern']);

/**
 * Run deterministic perturbation checks on caller-supplied labeled fixtures.
 * This is a development utility, not a validated production benchmark. It avoids
 * fabricated metrics and returns each misclassified example for human review.
 */
export function evaluateRobustness(
  examples: RobustnessExample[],
  config: NlpConfig,
): RobustnessReport {
  const rows: RobustnessRow[] = TRANSFORMS.map((transform) => {
    let correct = 0;
    const errors: RobustnessRow['errors'] = [];
    for (const example of examples) {
      const transformed = transform.apply(example.text);
      const prediction = classifyIntent(transformed, config, example.language).intent;
      if (prediction === example.expected) correct += 1;
      else errors.push({ input: transformed, expected: example.expected, predicted: prediction });
    }
    return {
      transform: transform.name,
      total: examples.length,
      correct,
      accuracy: examples.length ? Number((correct / examples.length).toFixed(4)) : 0,
      errors,
    };
  });

  let lowConfidenceCount = 0;
  let criticalControlFalsePositives = 0;
  for (const example of examples) {
    const prediction = classifyIntent(example.text, config, example.language);
    if (prediction.shouldClarify || prediction.confidence < config.minIntentConfidence) lowConfidenceCount += 1;
    if (!CRITICAL.has(example.expected) && CRITICAL.has(prediction.intent)) criticalControlFalsePositives += 1;
  }

  return {
    totalCases: examples.length,
    transformations: rows,
    lowConfidenceCount,
    criticalControlFalsePositives,
    warnings: [
      'Scores measure only this supplied fixture and the listed text transformations.',
      'Passing perturbation checks does not establish clinical safety or real-world model accuracy.',
      'Review every critical-control false positive and false negative manually before release.',
    ],
  };
}
