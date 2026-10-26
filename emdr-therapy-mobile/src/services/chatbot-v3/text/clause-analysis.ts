import { normalizeForMatching } from './normalize-base.ts';
import { splitSentences } from './tokenize.ts';

export interface Clause { text: string; normalized: string; index: number; boundary: 'sentence' | 'contrast' | 'semicolon' | 'comma' | 'end'; }
export interface NegationScope { negated: boolean; cue?: string; cueIndex: number; targetIndex: number; }
export interface UtteranceContext {
  clauses: Clause[];
  isQuotedOrHypothetical: boolean;
  isReportedSpeech: boolean;
  hasConditional: boolean;
  hasTemporalUrgency: boolean;
  hasSelfReference: boolean;
  hasOtherReference: boolean;
  commandMood: boolean;
}

const CONTRAST = /\b(?:but|however|although|though|yet|except|mais|pourtant|pero|sin embargo)\b/iu;
const REPORTED = /\b(?:my friend said|someone told me|the character says|the phrase|the words|a lyric says|in a book|in my story|he said|she said|they said|il a dit|elle a dit|dijo que)\b/iu;
const HYPOTHETICAL = /\b(?:hypothetically|imagine if|what if|suppose that|for a story|in theory|if i were to|si fuera|imaginons)\b/iu;
const CONDITIONAL = /\b(?:if|unless|might|could|would|maybe|perhaps|possibly|si|peut etre|tal vez|quizas)\b/iu;
const URGENCY = /\b(?:right now|immediately|tonight|today|in the next few minutes|right away|maintenant|esta noche|ahora mismo)\b/iu;
const SELF = /\b(?:i|i'm|i am|me|myself|my|je|moi|me|yo|mi|mismo|misma)\b/iu;
const OTHER = /\b(?:someone else|my friend|my partner|he|she|they|him|her|them|mon ami|ma amie|mi amigo|mi pareja)\b/iu;
const COMMAND = /^(?:please\s+)?(?:pause|stop|end|turn off|mute|start|begin|ground|breathe|arrête|pausa|detente)\b/iu;

/** Sentence/clause segmentation for handling contrast and quoted language. */
export function splitClauses(text: string): Clause[] {
  const rawSentences = splitSentences(String(text ?? ''));
  const clauses: Clause[] = [];
  for (let sentenceIndex = 0; sentenceIndex < rawSentences.length; sentenceIndex += 1) {
    const sentence = rawSentences[sentenceIndex];
    const parts = sentence.split(/\s*(;|,)\s*|\s+(?=but\b|however\b|although\b|mais\b|pero\b)/iu).filter(Boolean);
    let lastBoundary: Clause['boundary'] = sentenceIndex === rawSentences.length - 1 ? 'end' : 'sentence';
    for (const part of parts) {
      if (/^[;,]$/u.test(part)) { lastBoundary = part === ';' ? 'semicolon' : 'comma'; continue; }
      const trimmed = part.trim();
      if (!trimmed) continue;
      const contrast = CONTRAST.test(trimmed);
      clauses.push({ text: trimmed, normalized: normalizeForMatching(trimmed), index: clauses.length, boundary: contrast ? 'contrast' : lastBoundary });
    }
  }
  return clauses;
}

/** Reports whether a negation cue is close to a candidate token; does not infer intent by itself. */
export function findNegationScope(text: string, targetWords: string[], windowSize = 4): NegationScope {
  const tokens = normalizeForMatching(text).split(/\s+/u).filter(Boolean);
  const targets = new Set(targetWords.map(normalizeForMatching));
  const negators = new Set(['not', 'never', 'no', 'dont', "don't", 'cannot', "can't", 'won', 'pas', 'ne', 'jamais', 'nunca']);
  const targetIndex = tokens.findIndex((token) => targets.has(token));
  if (targetIndex < 0) return { negated: false, cueIndex: -1, targetIndex: -1 };
  const start = Math.max(0, targetIndex - Math.max(1, windowSize));
  for (let index = targetIndex - 1; index >= start; index -= 1) {
    if (negators.has(tokens[index])) return { negated: true, cue: tokens[index], cueIndex: index, targetIndex };
  }
  return { negated: false, cueIndex: -1, targetIndex };
}

export function analyzeUtteranceContext(text: string): UtteranceContext {
  const value = String(text ?? '');
  const normalized = normalizeForMatching(value);
  return {
    clauses: splitClauses(value),
    isQuotedOrHypothetical: /[“”"]/.test(value) || REPORTED.test(normalized) || HYPOTHETICAL.test(normalized),
    isReportedSpeech: REPORTED.test(normalized),
    hasConditional: CONDITIONAL.test(normalized),
    hasTemporalUrgency: URGENCY.test(normalized),
    hasSelfReference: SELF.test(normalized),
    hasOtherReference: OTHER.test(normalized),
    commandMood: COMMAND.test(normalized),
  };
}
