import type { Source } from '../types.ts';
export type GroundedAnswer={text:string;sources:Source[];grounded:boolean;reason:'verified-source'|'insufficient-evidence'|'no-source'};
export function composeGroundedAnswer(article:{id:string;title:string;body:string;locale:'en'|'fr'|'es';reviewed:boolean},minimumChars=20):GroundedAnswer {
  if(!article.reviewed)return {text:'I do not have reviewed information for that answer yet.',sources:[],grounded:false,reason:'insufficient-evidence'};
  const body=article.body.trim();
  if(body.length<minimumChars)return {text:'I do not have enough reviewed information to answer confidently.',sources:[],grounded:false,reason:'insufficient-evidence'};
  return {text:body,sources:[{id:article.id,title:article.title,locale:article.locale,trust:'local-reviewed'}],grounded:true,reason:'verified-source'};
}
export function validateSourceIds(sources:Source[],knownIds:ReadonlySet<string>):{valid:Source[];dropped:number} {
  const valid=sources.filter(source=>knownIds.has(source.id)&&source.trust==='local-reviewed'&&source.title.length<=140);
  return {valid:valid.map(s=>({...s})),dropped:sources.length-valid.length};
}
