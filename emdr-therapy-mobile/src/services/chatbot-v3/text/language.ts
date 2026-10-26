import type { Language } from '../types.ts';
import { normalizeForMatching } from './normalize-base.ts';

const MARKERS: Record<'en' | 'fr' | 'es', string[]> = {
  en: ['the', 'and', 'i', 'feel', 'want', 'please', 'can', 'help', 'my', 'is', 'am', 'need', 'stop'],
  fr: ['le', 'la', 'les', 'et', 'je', 'me', 'suis', 'besoin', 'aide', 'arrêter', 'respirer', 'calme'],
  es: ['el', 'la', 'los', 'y', 'yo', 'me', 'siento', 'necesito', 'ayuda', 'parar', 'respirar', 'calma'],
};

export function detectLanguage(text: string): Language {
  const normalized = normalizeForMatching(text);
  if (!normalized) return 'unknown';
  const tokens = normalized.split(/\s+/u);
  const scores: Record<'en' | 'fr' | 'es', number> = { en: 0, fr: 0, es: 0 };
  for (const language of Object.keys(MARKERS) as Array<'en' | 'fr' | 'es'>) {
    for (const marker of MARKERS[language]) {
      if (tokens.includes(normalizeForMatching(marker))) scores[language] += 1;
    }
  }
  // Accents are useful evidence, but never enough alone to make a confident routing decision.
  if (/[àâçéèêëîïôûùüÿœ]/i.test(text)) scores.fr += 1;
  if (/[¿¡ñáíóú]/i.test(text)) scores.es += 1;
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ordered[0][1] < 1 || ordered[0][1] === ordered[1][1]) return 'unknown';
  if (ordered[0][1] - ordered[1][1] < 1) return 'unknown';
  return ordered[0][0] as Language;
}
