import type { Intent, Locale, UserPreferences } from '../types.ts';
export type ReplyCandidate={id:string;intent:Intent;locale:Locale;text:string;style:'warm'|'neutral'|'concise';reviewed:boolean;};
export type ReplyFeedback={candidateId:string;label:'helpful'|'not-helpful';intent:Intent;locale:Locale;style:ReplyCandidate['style'];};
/** Learns only from explicit categorical feedback, not raw text or mental-health status. */
export class ConsentedReplyRanker {
 private readonly counts=new Map<string,{positive:number;negative:number}>();
 constructor(private readonly enabled=false,private readonly minimumObservations=3){}
 observe(feedback:ReplyFeedback,consent:boolean):boolean {
  if(!this.enabled||!consent)return false;if(!/^[a-z0-9_-]{1,50}$/i.test(feedback.candidateId))return false;
  const key=this.key(feedback.intent,feedback.locale,feedback.style);const row=this.counts.get(key)??{positive:0,negative:0};
  if(feedback.label==='helpful')row.positive++;else row.negative++;this.counts.set(key,row);return true;
 }
 score(candidate:ReplyCandidate,prefs:UserPreferences):number {
  if(!candidate.reviewed)return -1;let score=0.5;if(prefs.tone===candidate.style)score+=0.15;
  const row=this.counts.get(this.key(candidate.intent,candidate.locale,candidate.style));if(row&&(row.positive+row.negative)>=this.minimumObservations){score+=(row.positive-row.negative)/(row.positive+row.negative)*0.2;}
  return Math.max(0,Math.min(1,score));
 }
 rank(candidates:ReplyCandidate[],prefs:UserPreferences):ReplyCandidate[]{return candidates.filter(c=>c.reviewed).map(c=>({c,score:this.score(c,prefs)})).sort((a,b)=>b.score-a.score||a.c.id.localeCompare(b.c.id)).map(v=>({...v.c}));}
 reset():void{this.counts.clear();}
 snapshot():Array<{key:string;positive:number;negative:number}>{return [...this.counts].map(([key,row])=>({key,positive:row.positive,negative:row.negative}));}
 private key(intent:Intent,locale:Locale,style:string):string{return `${intent}:${locale}:${style}`;}
}
