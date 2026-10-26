import type { ChatIntent, RouteResult } from '../types.ts';
import type { Language } from '../../types.ts';

export interface RepairHint {
  kind: 'correction' | 'affirmation' | 'negation' | 'continuation' | 'none';
  text: string;
  suggestedIntent?: ChatIntent;
  confidence: number;
}

const PATTERNS: Array<{ kind: RepairHint['kind']; re: RegExp; score: number }> = [
  { kind: 'correction', re: /^(?:i meant|what i meant was|sorry, i meant|not that,? i meant|je voulais dire|quería decir)\b/u, score: 0.88 },
  { kind: 'affirmation', re: /^(?:yes|yeah|yep|that one|please do|go ahead|oui|sí|si|d'accord|de acuerdo)\W*$/u, score: 0.72 },
  { kind: 'negation', re: /^(?:no|no thanks|not that|nevermind|non|pas ça|no gracias)\W*$/u, score: 0.78 },
  { kind: 'continuation', re: /^(?:tell me more|go on|continue|why|how so|and then|dis-moi en plus|cuéntame más)\W*$/u, score: 0.66 },
];

/** Identifies conversational repair markers without inventing a follow-up referent. */
export function detectRepairHint(text: string): RepairHint {
  const normalized = String(text ?? '').trim().toLocaleLowerCase().replace(/\s+/gu, ' ');
  if (!normalized) return { kind: 'none', text: '', confidence: 0 };
  for (const item of PATTERNS) if (item.re.test(normalized)) return { kind: item.kind, text: normalized, confidence: item.score };
  return { kind: 'none', text: normalized, confidence: 0 };
}

export function resolveRepairIntent(hint: RepairHint, previousIntent: ChatIntent | undefined, language: Language = 'unknown'): RouteResult | undefined {
  if (hint.kind === 'none' || hint.kind === 'correction' || !previousIntent) return undefined;
  if (hint.kind === 'negation') {
    return { intent: 'clarify', confidence: 0.7, shouldClarify: true, sourceIntent: 'unknown', cues: ['explicit_rejection', language], directControl: 'none' };
  }
  if (hint.kind === 'affirmation' || hint.kind === 'continuation') {
    return { intent: previousIntent, confidence: hint.confidence, shouldClarify: false, sourceIntent: 'unknown', cues: ['follow_up', previousIntent], directControl: 'none' };
  }
  return undefined;
}
