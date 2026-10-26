import type { EmotionLabel, EmotionResult, Language } from '../types.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';

const LEXICON: Record<EmotionLabel, Record<Language, string[]>> = {
  anxious: {
    en: ['anxious', 'worried', 'nervous', 'afraid', 'fear', 'panic', 'uneasy', 'tense', 'scared', 'dread'],
    fr: ['anxieux', 'anxieuse', 'inquiet', 'inquiète', 'nerveux', 'peur', 'panique', 'tendu'],
    es: ['ansioso', 'ansiosa', 'preocupado', 'preocupada', 'nervioso', 'miedo', 'pánico', 'tenso'],
    unknown: ['anxious', 'worried', 'afraid'],
  },
  overwhelmed: {
    en: ['overwhelmed', 'too much', 'flooded', 'overloaded', 'cannot cope', 'can’t cope', 'stuck'],
    fr: ['dépassé', 'dépassée', 'trop', 'submergé', 'submergée'],
    es: ['abrumado', 'abrumada', 'demasiado', 'saturado', 'saturada'],
    unknown: ['overwhelmed'],
  },
  sad: {
    en: ['sad', 'down', 'hopeless', 'grief', 'heartbroken', 'empty', 'depressed', 'crying'],
    fr: ['triste', 'chagrin', 'désespéré', 'vide', 'pleurer'],
    es: ['triste', 'pena', 'desesperado', 'vacío', 'llorando'],
    unknown: ['sad', 'down'],
  },
  angry: {
    en: ['angry', 'furious', 'mad', 'irritated', 'frustrated', 'rage'],
    fr: ['en colère', 'furieux', 'furieuse', 'irrité', 'frustré'],
    es: ['enojado', 'enojada', 'furioso', 'furiosa', 'irritado', 'frustrado'],
    unknown: ['angry'],
  },
  lonely: {
    en: ['lonely', 'alone', 'isolated', 'disconnected', 'no one understands'],
    fr: ['seul', 'seule', 'isolé', 'isolée', 'personne ne comprend'],
    es: ['solo', 'sola', 'aislado', 'aislada', 'nadie me entiende'],
    unknown: ['lonely'],
  },
  calm: {
    en: ['calm', 'peaceful', 'grounded', 'settled', 'steady', 'relaxed'],
    fr: ['calme', 'paisible', 'ancré', 'ancrée', 'détendu'],
    es: ['calmado', 'calmada', 'tranquilo', 'tranquila', 'relajado'],
    unknown: ['calm'],
  },
  hopeful: {
    en: ['hopeful', 'optimistic', 'encouraged', 'curious', 'ready to try'],
    fr: ['plein d espoir', 'encouragé', 'encouragée', 'curieux', 'curieuse'],
    es: ['esperanzado', 'esperanzada', 'animado', 'animada', 'curioso', 'curiosa'],
    unknown: ['hopeful'],
  },
  positive: {
    en: ['good', 'better', 'happy', 'grateful', 'relieved', 'okay', 'fine'],
    fr: ['bien', 'mieux', 'heureux', 'heureuse', 'reconnaissant', 'soulagé'],
    es: ['bien', 'mejor', 'feliz', 'agradecido', 'agradecida', 'aliviado'],
    unknown: ['better', 'good'],
  },
  mixed: { en: ['mixed feelings', 'bittersweet', 'part of me', 'at the same time'], fr: ['sentiments partagés'], es: ['sentimientos encontrados'], unknown: ['mixed feelings'] },
  neutral: { en: [], fr: [], es: [], unknown: [] },
};

const NEGATORS = new Set(['not', 'no', 'never', 'dont', "don't", 'isnt', "isn't", 'cannot', "can't", 'pas', 'ne', 'jamais', 'no', 'nunca']);

export function estimateEmotion(text: string, language: Language, enabled = true): EmotionResult {
  const zero: Record<EmotionLabel, number> = {
    anxious: 0, overwhelmed: 0, sad: 0, angry: 0, lonely: 0,
    calm: 0, hopeful: 0, positive: 0, mixed: 0, neutral: 0.1,
  };
  if (!enabled || !text.trim()) return makeResult('neutral', 0.2, zero, []);
  const normalized = normalizeForMatching(text);
  const words = normalized.split(/\s+/u);
  const cues: string[] = [];
  for (const label of Object.keys(LEXICON) as EmotionLabel[]) {
    const lexicon = [...LEXICON[label][language === 'unknown' ? 'unknown' : language], ...LEXICON[label].unknown];
    for (const phrase of new Set(lexicon)) {
      const needle = normalizeForMatching(phrase);
      if (!needle || !containsPhrase(normalized, needle)) continue;
      if (isNegatedNear(words, needle)) continue;
      zero[label] += Math.min(2.5, 1 + (needle.includes(' ') ? 0.35 : 0));
      if (cues.length < 8) cues.push(label);
    }
  }
  const total = Object.entries(zero).filter(([label]) => label !== 'neutral').reduce((sum, [, value]) => sum + value, 0);
  if (total === 0) return makeResult('neutral', 0.42, zero, []);
  const positive = zero.calm + zero.hopeful + zero.positive;
  const negative = zero.anxious + zero.overwhelmed + zero.sad + zero.angry + zero.lonely;
  if (positive > 0 && negative > 0) zero.mixed += 0.75;
  const candidateLabels = (Object.keys(zero) as EmotionLabel[]).filter((label) => label !== 'neutral');
  candidateLabels.sort((a, b) => zero[b] - zero[a]);
  let label = candidateLabels[0] ?? 'neutral';
  if (positive > 0 && negative > 0 && Math.abs(positive - negative) < 1.25) label = 'mixed';
  const top = zero[label];
  const second = candidateLabels.find((candidate) => candidate !== label);
  const confidence = Math.min(0.78, 0.35 + top / Math.max(1, total) * 0.4 + (top - (second ? zero[second] : 0)) * 0.05);
  return makeResult(label, confidence, zero, cues);
}

function containsPhrase(text: string, phrase: string): boolean {
  return (` ${text} `).includes(` ${phrase} `) || text === phrase;
}

function isNegatedNear(words: string[], phrase: string): boolean {
  const parts = phrase.split(/\s+/u);
  const index = words.findIndex((_, i) => words.slice(i, i + parts.length).join(' ') === phrase);
  if (index < 0) return false;
  return words.slice(Math.max(0, index - 3), index).some((word) => NEGATORS.has(word));
}

function makeResult(label: EmotionLabel, confidence: number, scores: Record<EmotionLabel, number>, cues: string[]): EmotionResult {
  const sum = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalizedScores = Object.fromEntries(Object.entries(scores).map(([key, value]) => [key, Number((value / sum).toFixed(3))])) as Record<EmotionLabel, number>;
  return { label, confidence: Number(Math.min(0.99, Math.max(0, confidence)).toFixed(3)), scores: normalizedScores, cues: [...new Set(cues)], isNonClinicalEstimate: true };
}
