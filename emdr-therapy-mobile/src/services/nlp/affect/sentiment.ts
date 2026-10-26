import type { Language } from '../types.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';

export interface SentimentResult {
  polarity: 'negative' | 'neutral' | 'positive' | 'mixed';
  valence: number;
  intensity: number;
  positiveCues: string[];
  negativeCues: string[];
  negationApplied: boolean;
  /** This is a lexical feature, not a clinical assessment. */
  nonClinical: true;
}

const POSITIVE: Record<Language, string[]> = {
  en: ['better', 'calm', 'calmer', 'relieved', 'hopeful', 'helpful', 'safe', 'comfortable', 'grateful', 'good', 'peaceful', 'supported', 'steady', 'ready'],
  fr: ['mieux', 'calme', 'soulagé', 'soulagée', 'espoir', 'utile', 'sécurité', 'confortable', 'reconnaissant', 'paisible'],
  es: ['mejor', 'calmado', 'calmada', 'aliviado', 'esperanza', 'útil', 'seguro', 'segura', 'cómodo', 'cómoda', 'tranquilo'],
  unknown: ['better', 'calm', 'helpful', 'good'],
};
const NEGATIVE: Record<Language, string[]> = {
  en: ['worse', 'afraid', 'scared', 'anxious', 'overwhelmed', 'unsafe', 'uncomfortable', 'sad', 'angry', 'lonely', 'hard', 'difficult', 'stuck', 'hopeless', 'worried'],
  fr: ['pire', 'peur', 'anxieux', 'anxieuse', 'dépassé', 'inquiet', 'inquiète', 'inconfortable', 'triste', 'colère', 'seul', 'seule', 'difficile'],
  es: ['peor', 'miedo', 'ansioso', 'ansiosa', 'abrumado', 'abrumada', 'incómodo', 'incómoda', 'triste', 'enojado', 'solitario', 'difícil'],
  unknown: ['worse', 'afraid', 'anxious', 'sad', 'hard'],
};
const INTENSIFIERS = new Set(['very', 'really', 'extremely', 'so', 'too', 'incredibly', 'très', 'vraiment', 'muy', 'realmente']);
const NEGATORS = new Set(['not', 'no', 'never', 'dont', "don't", 'cannot', "can't", 'pas', 'ne', 'jamais', 'nunca']);

/** Fast bag-of-lexical-cues sentiment estimate with local negation and intensifier handling. */
export function analyzeSentiment(text: string, language: Language): SentimentResult {
  const normalized = normalizeForMatching(text);
  const tokens = normalized.split(/\s+/u).filter(Boolean);
  const positiveCues: string[] = [];
  const negativeCues: string[] = [];
  let positiveScore = 0;
  let negativeScore = 0;
  let negationApplied = false;
  let intensitySum = 0;
  let matches = 0;
  const positives = new Set([...(POSITIVE[language] ?? POSITIVE.unknown), ...POSITIVE.unknown]);
  const negatives = new Set([...(NEGATIVE[language] ?? NEGATIVE.unknown), ...NEGATIVE.unknown]);
  for (let i = 0; i < tokens.length; i += 1) {
    const word = tokens[i];
    const phrase = tokens.slice(i, i + 2).join(' ');
    const cue = positives.has(word) ? 'positive' : negatives.has(word) ? 'negative' : positives.has(phrase) ? 'positive' : negatives.has(phrase) ? 'negative' : null;
    if (!cue) continue;
    const negated = tokens.slice(Math.max(0, i - 3), i).some((item) => NEGATORS.has(item));
    const multiplier = tokens.slice(Math.max(0, i - 2), i).some((item) => INTENSIFIERS.has(item)) ? 1.5 : 1;
    let effectiveCue = cue;
    if (negated) { effectiveCue = cue === 'positive' ? 'negative' : 'positive'; negationApplied = true; }
    if (effectiveCue === 'positive') { positiveScore += multiplier; positiveCues.push(word); }
    else { negativeScore += multiplier; negativeCues.push(word); }
    intensitySum += multiplier;
    matches += 1;
  }
  const raw = positiveScore - negativeScore;
  const valence = matches ? Math.max(-1, Math.min(1, raw / Math.max(2, positiveScore + negativeScore))) : 0;
  const intensity = Math.min(1, intensitySum / Math.max(4, tokens.length * 0.45));
  const polarity = positiveScore > 0 && negativeScore > 0 && Math.abs(raw) < 1.5
    ? 'mixed'
    : raw > 0 ? 'positive' : raw < 0 ? 'negative' : 'neutral';
  return { polarity, valence: round(valence), intensity: round(intensity), positiveCues: [...new Set(positiveCues)].slice(0, 6), negativeCues: [...new Set(negativeCues)].slice(0, 6), negationApplied, nonClinical: true };
}

function round(value: number): number { return Number(value.toFixed(3)); }
