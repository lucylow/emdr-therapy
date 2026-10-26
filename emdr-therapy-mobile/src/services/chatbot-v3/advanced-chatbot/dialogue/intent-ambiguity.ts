import type { Intent, IntentCandidate, Locale } from '../types.ts';
export type IntentResolution = { action:'route'|'clarify'|'fallback'; intent?:Intent; confidence:number; margin:number; options:Intent[]; reason:'clear-winner'|'low-confidence'|'close-scores'|'no-candidate'|'safety-override' };
const LABELS:Record<Locale,Partial<Record<Intent,string>>>= {
 en:{app_help:'App help',emdr_definition:'What EMDR means',grounding:'Grounding exercise',breathing:'Breathing guide',session_setup:'Session setup',adjust_speed:'Movement speed',adjust_duration:'Session duration',adjust_audio:'Audio settings',adjust_visual:'Visual settings',pause:'Pause',resume:'Resume',stop:'Stop',privacy:'Privacy settings',feedback:'Feedback',greeting:'Greeting',farewell:'Goodbye',clarify:'Clarify',unknown:'Other question'},
 fr:{app_help:'Aide de l’application',emdr_definition:'Signification de l’EMDR',grounding:'Exercice d’ancrage',breathing:'Guide de respiration',session_setup:'Configuration de la séance',adjust_speed:'Vitesse du mouvement',adjust_duration:'Durée de la séance',adjust_audio:'Paramètres audio',adjust_visual:'Paramètres visuels',pause:'Pause',resume:'Reprendre',stop:'Arrêter',privacy:'Confidentialité',feedback:'Avis',greeting:'Salutation',farewell:'Au revoir',clarify:'Préciser',unknown:'Autre question'},
 es:{app_help:'Ayuda de la app',emdr_definition:'Qué significa EMDR',grounding:'Ejercicio de anclaje',breathing:'Guía de respiración',session_setup:'Configurar sesión',adjust_speed:'Velocidad del movimiento',adjust_duration:'Duración de la sesión',adjust_audio:'Ajustes de audio',adjust_visual:'Ajustes visuales',pause:'Pausar',resume:'Reanudar',stop:'Detener',privacy:'Privacidad',feedback:'Comentarios',greeting:'Saludo',farewell:'Despedida',clarify:'Aclarar',unknown:'Otra pregunta'}
};
const NON_CLARIFIABLE = new Set<Intent>(['pause','resume','stop']);
/** Score-margin policy separates ambiguous natural language from exact safety controls. */
export function resolveIntentAmbiguity(candidates:readonly IntentCandidate[],options:{minConfidence?:number;minMargin?:number;locale:Locale;safetyOverride?:boolean;maxOptions?:number}):IntentResolution{
 if(options.safetyOverride)return{action:'route',intent:'safety_support',confidence:1,margin:1,options:['safety_support'],reason:'safety-override'};
 const normalized=candidates.filter(c=>Number.isFinite(c.score)&&c.score>=0&&c.score<=1&&typeof c.intent==='string').slice().sort((a,b)=>b.score-a.score);
 if(!normalized.length)return{action:'fallback',confidence:0,margin:0,options:[],reason:'no-candidate'};
 const best=normalized[0]!;const second=normalized[1];const margin=best.score-(second?.score??0);
 if(NON_CLARIFIABLE.has(best.intent))return{action:'route',intent:best.intent,confidence:best.score,margin,options:[best.intent],reason:'clear-winner'};
 const minConfidence=clamp(options.minConfidence??0.48,0.1,0.95);const minMargin=clamp(options.minMargin??0.12,0.01,0.6);
 if(best.score<minConfidence)return{action:'clarify',confidence:best.score,margin,options:optionList(normalized,options.maxOptions??3),reason:'low-confidence'};
 if(second&&margin<minMargin)return{action:'clarify',confidence:best.score,margin,options:optionList(normalized,options.maxOptions??3),reason:'close-scores'};
 return{action:'route',intent:best.intent,confidence:best.score,margin,options:[best.intent],reason:'clear-winner'};
}
export function clarificationLabels(intents:readonly Intent[],locale:Locale,max=3):Array<{intent:Intent;label:string}>{return [...new Set(intents)].filter(i=>i!=='unknown'&&i!=='clarify').slice(0,clamp(max,1,3)).map(intent=>({intent,label:LABELS[locale][intent]??LABELS[locale].unknown!}));}
function optionList(candidates:IntentCandidate[],max:number):Intent[]{return [...new Set(candidates.slice(0,clamp(max,1,3)).map(c=>c.intent))].filter(i=>i!=='unknown'&&i!=='clarify');}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;}
