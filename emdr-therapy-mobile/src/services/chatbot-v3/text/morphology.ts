import type { Language } from '../types.ts';
import { normalizeForMatching } from './normalize-base.ts';
import { tokenize } from './tokenize.ts';

const STOP_WORDS: Record<Language, Set<string>> = {
  en: new Set('a an the and or but if then so of to for in on at by with from as is am are was were be been being it this that these those i me my mine we our you your he she they them their do does did can could would should will might must not no yes please about'.split(' ')),
  fr: new Set('le la les un une des et ou mais si alors de du à au aux en sur dans par avec pour je me moi mon ma mes nous notre vous votre il elle ils elles est suis sont était être pas ne jamais ce cette ces'.split(' ')),
  es: new Set('el la los las un una unos unas y o pero si entonces de del a en con para por como es soy son era ser no nunca yo me mi mis nosotros nuestro usted tu tus su sus'.split(' ')),
  unknown: new Set('a an the and or but if then so of to for in on at by with from is am are was were be it this that i me my you your not no yes'.split(' ')),
};

export function removeStopWords(text: string, language: Language): string[] {
  const stopWords = STOP_WORDS[language] ?? STOP_WORDS.unknown;
  return tokenize(normalizeForMatching(text)).filter((token) => /[\p{L}\p{N}]/u.test(token) && !stopWords.has(token));
}

/** Lightweight suffix stripping for search features only. Do not use it for user-visible text. */
export function stemForMatching(token: string, language: Language): string {
  let word = normalizeForMatching(token);
  if (word.length < 5) return word;
  const suffixes: Record<Language, string[]> = {
    en: ['ingly', 'edly', 'ation', 'ments', 'ment', 'ness', 'ing', 'ers', 'ies', 'ed', 'es', 's'],
    fr: ['issements', 'issement', 'atrices', 'ateurs', 'ations', 'ement', 'ments', 'ment', 'ées', 'ée', 'es', 's'],
    es: ['amientos', 'imientos', 'aciones', 'adores', 'adoras', 'mente', 'ación', 'iendo', 'ando', 'ados', 'adas', 'es', 'os', 'as', 's'],
    unknown: ['ing', 'ed', 'es', 's'],
  };
  for (const suffix of suffixes[language] ?? suffixes.unknown) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      word = word.slice(0, -suffix.length);
      break;
    }
  }
  return word;
}

export function stems(text: string, language: Language): string[] {
  return removeStopWords(text, language).map((token) => stemForMatching(token, language));
}

export function lexicalOverlap(left: string, right: string, language: Language = 'unknown'): number {
  const a = new Set(stems(left, language));
  const b = new Set(stems(right, language));
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const token of a) if (b.has(token)) common += 1;
  return common / (a.size + b.size - common);
}

export function classifyQuestionType(text: string): 'what' | 'why' | 'how' | 'when' | 'where' | 'who' | 'yes_no' | 'request' | 'statement' {
  const normalized = normalizeForMatching(text);
  if (/^(?:what|que|qué)\b/u.test(normalized)) return 'what';
  if (/^(?:why|por que|pourquoi)\b/u.test(normalized)) return 'why';
  if (/^(?:how|como|comment)\b/u.test(normalized)) return 'how';
  if (/^(?:when|cuando|quand)\b/u.test(normalized)) return 'when';
  if (/^(?:where|donde|ou)\b/u.test(normalized)) return 'where';
  if (/^(?:who|quien|qui)\b/u.test(normalized)) return 'who';
  if (/^(?:can|could|would|do|does|is|are|am|est|es|puedo|puede)\b/u.test(normalized) && text.includes('?')) return 'yes_no';
  if (/^(?:please|help me|can you|could you|aide moi|ayudame)\b/u.test(normalized)) return 'request';
  return 'statement';
}
