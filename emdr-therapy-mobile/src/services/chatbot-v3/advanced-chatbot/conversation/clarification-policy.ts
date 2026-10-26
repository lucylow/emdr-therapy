import type { Intent, IntentCandidate, Locale } from '../types.ts';

export type ClarificationReason = 'empty'|'low-confidence'|'close-alternatives'|'multiple-goals'|'missing-slot'|'clear';
export type ClarificationDecision = { ask: boolean; reason: ClarificationReason; selected?: IntentCandidate; alternatives: IntentCandidate[]; prompt: string };
export type ClarificationOptions = { minConfidence?: number; minMargin?: number; maxAlternatives?: number; requiredSlots?: Partial<Record<Intent, string[]>>; knownSlots?: string[] };
const DIRECT: Intent[] = ['pause','resume','stop'];
const PROMPTS: Record<Locale, Record<ClarificationReason, string>> = {
  en:{empty:'What would you like help with?', 'low-confidence':'Would you like help with app settings, grounding, breathing, or something else?','close-alternatives':'I can help in a few ways. Which is closest to what you need?', 'multiple-goals':'Which part would you like to handle first?', 'missing-slot':'Could you clarify one detail so I do not guess?', clear:''},
  fr:{empty:'Comment puis-je vous aider ?', 'low-confidence':'Souhaitez-vous de l’aide pour les réglages, l’ancrage, la respiration ou autre chose ?','close-alternatives':'Plusieurs options sont possibles. Laquelle correspond le mieux à votre besoin ?', 'multiple-goals':'Quelle partie souhaitez-vous traiter en premier ?', 'missing-slot':'Pouvez-vous préciser un détail pour éviter que je devine ?', clear:''},
  es:{empty:'¿Con qué te gustaría recibir ayuda?', 'low-confidence':'¿Buscas ayuda con ajustes, conexión con el presente, respiración u otra cosa?','close-alternatives':'Hay varias opciones posibles. ¿Cuál se acerca más a lo que necesitas?', 'multiple-goals':'¿Qué parte te gustaría resolver primero?','missing-slot':'¿Puedes aclarar un detalle para que no tenga que adivinar?', clear:''},
};
/** Chooses when to ask one lightweight question instead of guessing. It never decides clinical risk. */
export function decideClarification(candidates: IntentCandidate[], locale: Locale, options: ClarificationOptions = {}): ClarificationDecision {
  const valid = candidates.filter(c => Number.isFinite(c.score) && c.score >= 0 && c.score <= 1).slice();
  const known = valid.filter(c => c.intent !== 'unknown');
  const ranked = (known.length ? known : valid).sort((a,b)=>b.score-a.score);
  const top = ranked[0]; const second = ranked[1];
  const minConfidence = options.minConfidence ?? 0.56; const minMargin = options.minMargin ?? 0.14;
  let reason: ClarificationReason = 'clear';
  if (!top || top.intent === 'unknown') reason = ranked.length ? 'low-confidence' : 'empty';
  else if (DIRECT.includes(top.intent) && top.score >= 0.8) reason = 'clear';
  else if (options.requiredSlots?.[top.intent]?.some(s => !options.knownSlots?.includes(s))) reason = 'missing-slot';
  else if (ranked.filter(c=>c.score >= 0.5).length >= 3) reason = 'multiple-goals';
  else if (top.score < minConfidence) reason = 'low-confidence';
  else if (second && top.score-second.score < minMargin) reason = 'close-alternatives';
  const ask = reason !== 'clear';
  return {ask, reason, selected: ask ? undefined : top, alternatives: ranked.slice(ask ? 0 : 1, Math.max(1, options.maxAlternatives ?? 3)), prompt:PROMPTS[locale][reason]};
}

export function clarificationOptionsFromText(decision: ClarificationDecision): string[] {
  const unique = [...new Set(decision.alternatives.map(c=>c.intent).filter(x=>x!=='unknown'))];
  return unique.slice(0,4);
}
