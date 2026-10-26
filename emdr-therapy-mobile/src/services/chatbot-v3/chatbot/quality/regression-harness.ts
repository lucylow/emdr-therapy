import type { Language } from '../../types.ts';
import type { ChatIntent } from '../types.ts';
import { ChatIntentRouter } from '../routing/router.ts';
import { detectExactChatControl } from '../normalize.ts';

export type PerturbationKind = 'case' | 'leading_trailing_space' | 'repeated_whitespace' | 'terminal_punctuation' | 'unicode_quote' | 'zero_width';
export interface RegressionInput { id: string; text: string; expectedIntent: ChatIntent; language?: Language; criticalControl?: 'pause' | 'stop'; }
export interface RegressionResult { id: string; baseIntent: ChatIntent; perturbedIntent: ChatIntent; perturbation: PerturbationKind; intentStable: boolean; baseControl: string; perturbedControl: string; controlStable: boolean; }
export interface RegressionReport { total: number; stable: number; stability: number; controlCases: number; controlStable: number; controlStability: number; byPerturbation: Record<string, { total: number; stable: number }>; failures: RegressionResult[]; rows: RegressionResult[]; }

/** Synthetic invariance harness for harmless formatting variations; it does not test semantic equivalence. */
export function evaluateTextPerturbationStability(inputs: readonly RegressionInput[], router = new ChatIntentRouter()): RegressionReport {
  const rows: RegressionResult[] = [];
  for (const input of inputs) {
    const language = input.language ?? 'unknown';
    const base = router.route(input.text, language);
    for (const [kind, transform] of transformations) {
      const perturbedText = transform(input.text);
      const modified = router.route(perturbedText, language);
      const expected = input.criticalControl ?? 'none';
      const baseControl = detectExactChatControl(input.text);
      const perturbedControl = detectExactChatControl(perturbedText);
      const controlStable = expected === 'none' || baseControl === expected && perturbedControl === expected;
      rows.push({ id: `${input.id}:${kind}`, baseIntent: base.intent, perturbedIntent: modified.intent, perturbation: kind, intentStable: base.intent === modified.intent, baseControl, perturbedControl, controlStable });
    }
  }
  const byPerturbation: RegressionReport['byPerturbation'] = {};
  for (const row of rows) {
    const group = byPerturbation[row.perturbation] ?? { total: 0, stable: 0 };
    group.total++; if (row.intentStable) group.stable++;
    byPerturbation[row.perturbation] = group;
  }
  const controlRows = inputs.filter((item) => item.criticalControl !== undefined).flatMap((item) => rows.filter((row) => row.id.startsWith(`${item.id}:`)));
  const stable = rows.filter((row) => row.intentStable).length;
  const controlStable = controlRows.filter((row) => row.controlStable).length;
  return { total: rows.length, stable, stability: rows.length ? stable / rows.length : 1, controlCases: controlRows.length, controlStable, controlStability: controlRows.length ? controlStable / controlRows.length : 1, byPerturbation, failures: rows.filter((row) => !row.intentStable || !row.controlStable), rows };
}

const transformations: Array<[PerturbationKind, (value: string) => string]> = [
  ['case', (value) => value.toLocaleUpperCase('en')],
  ['leading_trailing_space', (value) => `  ${value}  `],
  ['repeated_whitespace', (value) => value.replace(/\s+/gu, '   ')],
  ['terminal_punctuation', (value) => `${value}!!!`],
  ['unicode_quote', (value) => `“${value}”`],
  ['zero_width', (value) => value.replace(/\s/u, '\u200b ')],
];
