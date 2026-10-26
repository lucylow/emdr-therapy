import type { IntentCandidate } from '../types.ts';
export type MultiIntentPlan={primary:IntentCandidate;secondary:IntentCandidate[];needsClarification:boolean;questionKind:'which-first'|'single'|'none'};
/** Keeps compound requests visible instead of silently dropping lower-ranked goals. */
export function buildMultiIntentPlan(candidates:IntentCandidate[],maxSecondary=2):MultiIntentPlan {
  const valid=candidates.filter(c=>c.intent!=='unknown'&&c.score>0).sort((a,b)=>b.score-a.score);
  if(!valid.length)return {primary:{intent:'unknown',score:0,evidence:[]},secondary:[],needsClarification:true,questionKind:'single'};
  const primary=valid[0];const secondary=valid.slice(1).filter(c=>c.score>=Math.max(0.35,primary.score*0.7)).slice(0,maxSecondary);
  const clash=secondary.some(c=>c.intent!==primary.intent&&Math.abs(c.score-primary.score)<0.08);
  return {primary,secondary,needsClarification:clash,questionKind:clash?'which-first':secondary.length?'none':'single'};
}
export function localizeMultiIntentQuestion(kind:MultiIntentPlan['questionKind'],locale:'en'|'fr'|'es'):string|undefined {
  if(kind==='none')return undefined;
  const text={
    en:{'which-first':'I found a couple of possible requests. Which one should we handle first?','single':'Could you clarify what you would like help with?'},
    fr:{'which-first':'J’ai repéré plusieurs demandes possibles. Laquelle souhaitez-vous traiter en premier ?','single':'Pouvez-vous préciser ce dont vous avez besoin ?'},
    es:{'which-first':'He encontrado varias solicitudes posibles. ¿Cuál quieres tratar primero?','single':'¿Puedes aclarar qué tipo de ayuda necesitas?'},
  };
  return text[locale][kind];
}
