import type { Locale, Source } from '../types.ts';
export type CitationCheck={valid:boolean;accepted:Source[];rejectedIds:string[];reasons:string[]};
const ID=/^[a-z0-9][a-z0-9-]{1,69}$/i;
export function validateCitations(proposed:Source[],available:Source[],locale:Locale,max=5):CitationCheck {
 const trusted=new Map(available.filter(s=>s.trust==='local-reviewed'&&s.locale===locale&&ID.test(s.id)).map(s=>[s.id,s]));const accepted:Source[]=[],rejectedIds:string[]=[],reasons:string[]=[];
 for(const p of proposed.slice(0,Math.max(0,Math.min(max,8)))){const known=trusted.get(p.id);if(!known||p.trust!=='local-reviewed'||p.locale!==locale||p.title!==known.title){rejectedIds.push(String(p.id).slice(0,80));continue;}if(!accepted.some(s=>s.id===known.id))accepted.push({...known});}
 if(proposed.length>max)reasons.push('citation-cap-applied');if(rejectedIds.length)reasons.push('unknown-or-untrusted-citation-removed');return{valid:rejectedIds.length===0,accepted,rejectedIds,reasons};
}
export function appendCitationMarkers(answer:string,sources:Source[]):string {const ids=sources.filter(s=>s.trust==='local-reviewed'&&ID.test(s.id)).slice(0,5).map(s=>`[${s.id}]`);return ids.length?`${answer.trim()}\n\nSources: ${ids.join(' ')}`:answer.trim();}
export function extractCitationMarkers(text:string):string[]{return[...new Set([...text.matchAll(/\[([a-z0-9][a-z0-9-]{1,69})\]/gi)].map(m=>m[1]!))].slice(0,10);}
