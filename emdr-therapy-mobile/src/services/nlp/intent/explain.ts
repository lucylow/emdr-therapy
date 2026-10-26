import type { IntentResult } from '../types.ts';

export interface IntentExplanation {
  route: string;
  confidenceBand: 'low' | 'moderate' | 'high';
  needsConfirmation: boolean;
  notes: string[];
}

/** Human-review explanation that exposes score ranges, not raw input or hidden chain-of-thought. */
export function explainIntent(result: IntentResult): IntentExplanation {
  const confidenceBand = result.confidence >= 0.75 ? 'high' : result.confidence >= 0.45 ? 'moderate' : 'low';
  const notes: string[] = [];
  if (result.source === 'hybrid') notes.push('Combined transparent phrase cues with a small local statistical classifier.');
  if (result.source === 'rules') notes.push('Matched a deterministic rule.');
  if (result.source === 'fallback') notes.push('Used the fallback path because the input was not confidently matched.');
  if (result.margin < 0.1) notes.push('Top candidate was close to an alternative.');
  if (result.intent === 'unknown') notes.push('Ask a neutral clarifying question rather than guessing.');
  if (result.intent === 'stop_request' || result.intent === 'pause_request') notes.push('The UI should offer a direct control; the NLP module does not operate the stimulation engine.');
  return { route: result.intent, confidenceBand, needsConfirmation: result.shouldClarify || confidenceBand === 'low', notes };
}
