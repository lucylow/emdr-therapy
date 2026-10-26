import { normalizeForMatching } from '../../text/normalize-base.ts';
import { tokenize } from '../../text/tokenize.ts';
import type { Language } from '../../types.ts';

export interface QueryTerms { language: 'en' | 'fr' | 'es'; originalTerms: string[]; expandedTerms: string[]; expansionsUsed: string[]; }

type SynonymRule = { language: 'en' | 'fr' | 'es'; canonical: string; terms: string[] };
const SYNONYMS: SynonymRule[] = [
  { language: 'en', canonical: 'therapist', terms: ['therapist', 'clinician', 'professional', 'psychologist', 'counsellor', 'counselor'] },
  { language: 'en', canonical: 'privacy', terms: ['privacy', 'private', 'confidential', 'confidentiality'] },
  { language: 'en', canonical: 'stop', terms: ['stop', 'end', 'finish', 'cancel'] },
  { language: 'en', canonical: 'pause', terms: ['pause', 'wait', 'break', 'hold'] },
  { language: 'en', canonical: 'grounding', terms: ['grounding', 'present', 'orient', 'here', 'now'] },
  { language: 'en', canonical: 'breathing', terms: ['breathing', 'breath', 'breathe', 'inhale', 'exhale'] },
  { language: 'fr', canonical: 'thérapeute', terms: ['thérapeute', 'clinicien', 'professionnel', 'psychologue'] },
  { language: 'fr', canonical: 'confidentialité', terms: ['confidentialité', 'privé', 'privée', 'secret'] },
  { language: 'fr', canonical: 'arrêt', terms: ['arrêt', 'arrêter', 'fin', 'stop'] },
  { language: 'fr', canonical: 'pause', terms: ['pause', 'attendre', 'repos'] },
  { language: 'fr', canonical: 'ancrage', terms: ['ancrage', 'présent', 'ici', 'maintenant'] },
  { language: 'fr', canonical: 'respiration', terms: ['respiration', 'souffle', 'inspirer', 'expirer'] },
  { language: 'es', canonical: 'terapeuta', terms: ['terapeuta', 'profesional', 'psicólogo', 'psicologo', 'clínico'] },
  { language: 'es', canonical: 'privacidad', terms: ['privacidad', 'privado', 'confidencial'] },
  { language: 'es', canonical: 'detener', terms: ['detener', 'parar', 'terminar', 'cancelar'] },
  { language: 'es', canonical: 'pausa', terms: ['pausa', 'esperar', 'descanso'] },
  { language: 'es', canonical: 'presente', terms: ['presente', 'aquí', 'aqui', 'ahora', 'anclaje'] },
  { language: 'es', canonical: 'respiración', terms: ['respiración', 'respiracion', 'respirar', 'inhalar', 'exhalar'] },
];

export function normalizeKnowledgeQuery(text: string, language: Language = 'unknown'): QueryTerms {
  const locale = language === 'fr' || language === 'es' ? language : 'en';
  const originalTerms = [...new Set(tokenize(normalizeForMatching(text)).filter((term) => term.length > 1))];
  const expanded = new Set(originalTerms);
  const expansionsUsed: string[] = [];
  for (const rule of SYNONYMS) {
    if (rule.language !== locale || !rule.terms.some((term) => originalTerms.includes(normalizeForMatching(term)))) continue;
    for (const term of rule.terms) {
      const normalized = normalizeForMatching(term);
      if (!expanded.has(normalized)) { expanded.add(normalized); expansionsUsed.push(normalized); }
    }
    expanded.add(normalizeForMatching(rule.canonical));
  }
  return { language: locale, originalTerms, expandedTerms: [...expanded].slice(0, 80), expansionsUsed: expansionsUsed.slice(0, 30) };
}

export function queryExpansionScoreBoost(originalTerms: string[], documentTerms: Set<string>, expandedTerms: string[]): number {
  const original = originalTerms.filter((term) => documentTerms.has(term)).length;
  const expanded = expandedTerms.filter((term) => documentTerms.has(term)).length;
  return Math.max(0, Math.min(0.24, (expanded - original) * 0.08));
}
