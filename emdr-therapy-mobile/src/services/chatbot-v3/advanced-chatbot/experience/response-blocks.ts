import type { ChatResponse, Locale, Source } from '../types.ts';
import { removeUnsafeMarkdown } from '../policy/output-validator.ts';
export type ResponseBlock=
 | {type:'paragraph';text:string}
 | {type:'bullets';items:string[]}
 | {type:'source-list';sources:Array<{id:string;title:string}>}
 | {type:'notice';tone:'neutral'|'caution';text:string}
 | {type:'quick-replies';items:Array<{id:string;label:string}>};
export type StructuredChatResponse={schemaVersion:1;locale:Locale;blocks:ResponseBlock[];mode:ChatResponse['mode'];turnId:string;actions:ChatResponse['suggestions'];safetyNotice:boolean};
const MAX_BLOCKS=10,MAX_ITEMS=8,MAX_BLOCK_TEXT=800;
export function structureResponse(response:ChatResponse):StructuredChatResponse {
 const clean=removeUnsafeMarkdown(response.text).slice(0,1800);const blocks:ResponseBlock[]=[];
 if(clean)blocks.push({type:'paragraph',text:clean});
 if(response.safetySignal!=='none')blocks.push({type:'notice',tone:'caution',text:safetyNotice(response.locale)});
 const sources=validSources(response.sources);if(sources.length)blocks.push({type:'source-list',sources});
 return {schemaVersion:1,locale:response.locale,blocks:blocks.slice(0,MAX_BLOCKS),mode:response.mode,turnId:response.turnId,actions:response.suggestions.slice(0,3).map(a=>({...a,parameters:a.parameters?{...a.parameters}:undefined})),safetyNotice:response.safetySignal!=='none'};
}
export function validateStructuredResponse(value:unknown):value is StructuredChatResponse {
 if(!value||typeof value!=='object')return false;const r=value as Record<string,unknown>;
 if(r.schemaVersion!==1||!['en','fr','es'].includes(String(r.locale))||!Array.isArray(r.blocks)||r.blocks.length>MAX_BLOCKS||!Array.isArray(r.actions)||r.actions.length>3)return false;
 if(typeof r.turnId!=='string'||r.turnId.length>100||typeof r.safetyNotice!=='boolean')return false;
 return r.blocks.every(block=>{
  if(!block||typeof block!=='object')return false;const b=block as Record<string,unknown>;
  if(b.type==='paragraph'||b.type==='notice')return typeof b.text==='string'&&b.text.length<=MAX_BLOCK_TEXT;
  if(b.type==='bullets')return Array.isArray(b.items)&&b.items.length<=MAX_ITEMS&&b.items.every(x=>typeof x==='string'&&x.length<=MAX_BLOCK_TEXT);
  if(b.type==='source-list')return Array.isArray(b.sources)&&b.sources.length<=MAX_ITEMS&&b.sources.every(s=>!!s&&typeof s==='object'&&typeof (s as {id?:unknown}).id==='string'&&typeof (s as {title?:unknown}).title==='string');
  if(b.type==='quick-replies')return Array.isArray(b.items)&&b.items.length<=MAX_ITEMS&&b.items.every(x=>!!x&&typeof x==='object'&&typeof (x as {id?:unknown}).id==='string'&&typeof (x as {label?:unknown}).label==='string');
  return false;
 });
}
export function parseRemoteStructuredContent(text:string,locale:Locale,turnId:string):StructuredChatResponse|undefined {
 try{const raw=JSON.parse(text);if(!validateStructuredResponse(raw))return undefined;const candidate=raw as StructuredChatResponse;
  // Remote results may not add arbitrary UI actions or fabricate source citations.
  return {schemaVersion:1,locale,blocks:candidate.blocks.filter(b=>b.type==='paragraph'||b.type==='bullets'||b.type==='notice').slice(0,MAX_BLOCKS),mode:'remote-reviewed',turnId,actions:[],safetyNotice:candidate.safetyNotice};
 }catch{return undefined;}
}
function validSources(sources:Source[]):Array<{id:string;title:string}>{return sources.filter(s=>s.trust==='local-reviewed'&&/^[a-z0-9-]{3,70}$/i.test(s.id)&&s.title.length<=140).slice(0,MAX_ITEMS).map(s=>({id:s.id,title:s.title}));}
function safetyNotice(locale:Locale):string{return ({en:'For urgent situations, contact local emergency services or a trusted person. The chatbot is not monitored by emergency responders.',fr:'En cas d’urgence, contactez les services d’urgence locaux ou une personne de confiance. Le chatbot n’est pas surveillé par des intervenants d’urgence.',es:'En una emergencia, contacta con los servicios de emergencia locales o con una persona de confianza. El chatbot no está supervisado por personal de emergencias.'})[locale];}
