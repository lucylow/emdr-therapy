import type { Locale } from '../types.ts';
export type SafeSegment={type:'text';text:string}|{type:'bullet';text:string}|{type:'link';text:string;url:string};
const MAX=2200;
/** Parses a tiny safe subset of markdown; arbitrary HTML and unsafe link schemes are removed. */
export function formatSafeAnswer(input:string):SafeSegment[] {
 const clean=input.slice(0,MAX).replace(/<[^>]*>/g,'').replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_all,label,url)=>`${label} <${url}>`);
 const out:SafeSegment[]=[];
 for(const line of clean.split(/\r?\n/).slice(0,24)){const trimmed=line.trim();if(!trimmed)continue;
  if(/^[-*•]\s+/.test(trimmed)){out.push({type:'bullet',text:trimmed.replace(/^[-*•]\s+/,'').slice(0,500)});continue;}
  const link=trimmed.match(/^(.*?)\s+<((?:https:\/\/|mailto:)[^\s<>]{1,300})>$/i);
  if(link){out.push({type:'text',text:link[1].slice(0,500)});const url=link[2];if(safeUrl(url))out.push({type:'link',text:labelForUrl(url),url});else out.push({type:'text',text:url.slice(0,250)});continue;}
  out.push({type:'text',text:trimmed.replace(/[`*_~]/g,'').slice(0,700)});
 }
 return out.slice(0,32);
}
export function safeUrl(value:string):boolean {try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='mailto:';}catch{return false;}}
function labelForUrl(url:string):string {try{return new URL(url).hostname.slice(0,100);}catch{return 'link';}}
export function plainText(segments:SafeSegment[]):string{return segments.map(s=>s.type==='link'?`${s.text} (${s.url})`:s.text).join('\n');}
export function localizedUnavailable(locale:Locale):string{return({en:'That content is not available in a safe format.',fr:'Ce contenu n’est pas disponible dans un format sûr.',es:'Ese contenido no está disponible en un formato seguro.'})[locale];}
