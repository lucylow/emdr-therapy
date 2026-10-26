import type { Intent, Locale } from '../types.ts';
export type RankedEvidence={id:string;score:number;intent?:Intent;locale:Locale;reviewed:boolean;title?:string};
export type RetrievalDecision={decision:'answer'|'clarify'|'fallback';selected?:RankedEvidence;alternatives:RankedEvidence[];margin:number;reason:'strong-reviewed-match'|'unreviewed-only'|'below-score-threshold'|'ambiguous-results'|'no-results'|'locale-mismatch'};
/** Converts retrieval scores to a conservative action; score values are ranking signals, not truth probabilities. */
export function decideRetrieval(results:readonly RankedEvidence[],options:{locale:Locale;intent?:Intent;minScore?:number;minMargin?:number;allowUnreviewed?:boolean;maxAlternatives?:number}):RetrievalDecision{
 const valid=results.filter(r=>validEvidence(r));const pool=valid.filter(r=>r.locale===options.locale&&(!options.intent||!r.intent||r.intent===options.intent||options.intent==='unknown')).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 if(!valid.length)return{decision:'fallback',alternatives:[],margin:0,reason:'no-results'};
 if(!pool.length)return{decision:'fallback',alternatives:[],margin:0,reason:valid.some(r=>r.locale!==options.locale)?'locale-mismatch':'no-results'};
 const reviewed=pool.filter(r=>r.reviewed);const allowed=options.allowUnreviewed?pool:reviewed;
 if(!allowed.length)return{decision:'fallback',alternatives:pool.slice(0,3),margin:0,reason:'unreviewed-only'};
 const best=allowed[0]!;const second=allowed[1];const margin=best.score-(second?.score??0);const minScore=clamp(options.minScore??.35,0,1);const minMargin=clamp(options.minMargin??.1,0,1);
 if(best.score<minScore)return{decision:'fallback',alternatives:allowed.slice(0,limit(options.maxAlternatives)),margin,reason:'below-score-threshold'};
 if(second&&margin<minMargin)return{decision:'clarify',selected:best,alternatives:allowed.slice(0,limit(options.maxAlternatives)),margin,reason:'ambiguous-results'};
 if(!best.reviewed)return{decision:'fallback',alternatives:allowed.slice(0,3),margin,reason:'unreviewed-only'};
 return{decision:'answer',selected:best,alternatives:allowed.slice(1,limit(options.maxAlternatives)+1),margin,reason:'strong-reviewed-match'};
}
function validEvidence(v:RankedEvidence):boolean{return Boolean(v&&typeof v.id==='string'&&/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(v.id)&&Number.isFinite(v.score)&&v.score>=0&&v.score<=1&&['en','fr','es'].includes(v.locale)&&typeof v.reviewed==='boolean');}
function limit(n:number|undefined):number{return Math.max(0,Math.min(5,Math.floor(Number.isFinite(n)?n??0:3)));}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,n)):min;}
