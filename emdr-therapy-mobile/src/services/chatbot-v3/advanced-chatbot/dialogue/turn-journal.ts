import type { Intent, Locale, RiskSignal } from '../types.ts';
export type TurnMode='local-template'|'local-retrieval'|'remote-reviewed'|'safe-fallback';
export type ConfidenceBand='high'|'medium'|'low';
export type SafeTurnRecord={turnId:string;intent:Intent;locale:Locale;mode:TurnMode;confidence:ConfidenceBand;safetySignal:RiskSignal;at:number};
export type TurnJournalSummary={count:number;byIntent:Record<string,number>;byLocale:Record<Locale,number>;byMode:Record<TurnMode,number>;safetyRoutes:number;lowConfidence:number};
/** Bounded metadata journal for local diagnostics; raw user and assistant text are not accepted by its schema. */
export class SafeTurnJournal{
 private rows:SafeTurnRecord[]=[];
 constructor(private options:{capacity?:number;ttlMs?:number}={}){}
 record(input:{turnId:string;intent:Intent;locale:Locale;mode:TurnMode;confidence:number;safetySignal:RiskSignal;at:number},now=input.at):boolean{
  if(!input||typeof input.turnId!=='string'||! /^[a-z0-9_.-]{1,100}$/i.test(input.turnId)||!Number.isFinite(input.at)||input.at>now+60_000||input.at<now-clamp(this.options.ttlMs??7*86400_000,60_000,90*86400_000)||!validLocale(input.locale)||!validMode(input.mode)||!validRisk(input.safetySignal)||!Number.isFinite(input.confidence)||input.confidence<0||input.confidence>1)return false;
  const row:SafeTurnRecord={turnId:input.turnId,intent:input.intent,locale:input.locale,mode:input.mode,confidence:input.confidence>=.72?'high':input.confidence>=.45?'medium':'low',safetySignal:input.safetySignal,at:Math.floor(input.at)};
  this.prune(now);this.rows.push(row);while(this.rows.length>clamp(this.options.capacity??300,10,5000))this.rows.shift();return true;
 }
 summary(now=Date.now()):TurnJournalSummary{
  this.prune(now);const byIntent:Record<string,number>={};const byLocale:Record<Locale,number>={en:0,fr:0,es:0};const byMode:Record<TurnMode,number>={'local-template':0,'local-retrieval':0,'remote-reviewed':0,'safe-fallback':0};let safetyRoutes=0,lowConfidence=0;
  for(const r of this.rows){byIntent[r.intent]=(byIntent[r.intent]??0)+1;byLocale[r.locale]++;byMode[r.mode]++;if(r.safetySignal!=='none')safetyRoutes++;if(r.confidence==='low')lowConfidence++;}
  return{count:this.rows.length,byIntent,byLocale,byMode,safetyRoutes,lowConfidence};
 }
 snapshot(now=Date.now()):SafeTurnRecord[]{this.prune(now);return this.rows.map(r=>({...r}));}
 clear():void{this.rows=[];}
 get size():number{return this.rows.length;}
 private prune(now:number):void{const ttl=clamp(this.options.ttlMs??7*86400_000,60_000,90*86400_000);this.rows=this.rows.filter(r=>r.at>=now-ttl);}
}
function validLocale(v:string):v is Locale{return v==='en'||v==='fr'||v==='es';}
function validMode(v:string):v is TurnMode{return v==='local-template'||v==='local-retrieval'||v==='remote-reviewed'||v==='safe-fallback';}
function validRisk(v:string):v is RiskSignal{return v==='none'||v==='urgent_support_request'||v==='self_harm_language'||v==='immediate_danger_language';}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
