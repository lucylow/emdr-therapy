import type { Intent, Locale } from '../types.ts';
export type FollowupMemory={lastIntent?:Intent;pendingQuestionId?:string;pendingOptions:string[];lastAction?:string;updatedAt:number};
export type FollowupResult={matched:boolean;intent?:Intent;choice?:string;reason:'option-selected'|'affirmative'|'negative'|'context-word'|'not-a-followup'};
const YES:Record<Locale,string[]>={en:['yes','yes please','that one','do that','okay','ok','sounds good'],fr:['oui','oui s’il vous plaît','celle-là','d’accord','ok'],es:['sí','sí por favor','esa','de acuerdo','vale']};
const NO:Record<Locale,string[]>={en:['no','no thanks','not that','cancel','never mind'],fr:['non','pas ça','annuler','laisse tomber'],es:['no','no gracias','cancelar','déjalo']};
const CONTEXT:Record<Locale,Record<string,Intent>>={en:{slower:'adjust_speed',faster:'adjust_speed',shorter:'adjust_duration',longer:'adjust_duration',quieter:'adjust_audio',louder:'adjust_audio',again:'clarify'},fr:{'plus lent':'adjust_speed','plus vite':'adjust_speed','plus court':'adjust_duration','plus long':'adjust_duration','moins fort':'adjust_audio'},es:{'más despacio':'adjust_speed','más rápido':'adjust_speed','más corto':'adjust_duration','más largo':'adjust_duration','más bajo':'adjust_audio'}};
export function resolveFollowup(text:string,locale:Locale,memory:FollowupMemory):FollowupResult {
 const t=text.normalize('NFKC').toLowerCase().replace(/[’']/g,'’').replace(/[!?.,]/g,'').trim();
 const option=memory.pendingOptions.find(o=>o.toLowerCase()===t);if(option)return{matched:true,choice:option,reason:'option-selected'};
 if(YES[locale].includes(t))return{matched:!!memory.pendingQuestionId,intent:memory.lastIntent,reason:'affirmative'};
 if(NO[locale].includes(t))return{matched:!!memory.pendingQuestionId,reason:'negative'};
 const entry=Object.entries(CONTEXT[locale]).find(([phrase])=>t===phrase);if(entry)return{matched:true,intent:entry[1],reason:'context-word'};
 return{matched:false,reason:'not-a-followup'};
}
export function createFollowupMemory(input:Partial<FollowupMemory>,now=Date.now()):FollowupMemory{return{lastIntent:input.lastIntent,pendingQuestionId:input.pendingQuestionId,pendingOptions:(input.pendingOptions??[]).slice(0,5).map(s=>s.slice(0,80)),lastAction:input.lastAction?.slice(0,60),updatedAt:now};}
