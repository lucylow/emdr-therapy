import type { Locale, Source } from '../types.ts';
export type CitationViewModel = { id: string; title: string; detail: string; label: string; locale: Locale; testId: string };
const LABELS: Record<Locale, string> = { en:'Source', fr:'Source', es:'Fuente' };
/** Converts sources that have already passed a reviewed citation allowlist into plain text UI models. */
export function renderReviewedCitations(sources: readonly Source[], locale: Locale, max = 4): CitationViewModel[] {
 const safeMax=Math.max(0,Math.min(8,Math.floor(max)));const seen=new Set<string>();const result:CitationViewModel[]=[];
 for(const source of sources){
  if(result.length>=safeMax)break;
  if(source.trust!=='local-reviewed'||source.locale!==locale||!safeId(source.id)||seen.has(source.id))continue;
  if(typeof source.title!=='string'||!source.title.trim()||source.title.length>180)continue;
  seen.add(source.id);result.push({id:source.id,title:plain(source.title,180),detail:plain(source.snippet??'',240),label:LABELS[locale],locale,testId:`citation-${source.id.replace(/[^a-z0-9_-]/gi,'').slice(0,60)}`});
 }
 return result;
}
export function renderCitationText(models: readonly CitationViewModel[]): string {
 return models.map((m,i)=>`${i+1}. ${m.label}: ${m.title}${m.detail?` — ${m.detail}`:''}`).join('\n');
}
function plain(s:string,max:number):string{return s.replace(/<[^>]{1,200}>/g,'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function safeId(s:string):boolean{return /^[a-z0-9][a-z0-9._-]{1,100}$/i.test(s);}
