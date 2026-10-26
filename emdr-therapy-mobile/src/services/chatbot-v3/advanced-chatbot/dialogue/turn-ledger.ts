import type { Intent, Locale, RiskSignal } from '../types.ts';
export type LedgerKind='received'|'classified'|'local-answer'|'retrieval-answer'|'remote-attempt'|'remote-blocked'|'fallback'|'feedback'|'cleared';
export type LedgerEvent={eventId:string;kind:LedgerKind;at:number;intent?:Intent;locale?:Locale;risk?:RiskSignal;reasonCode?:string;durationMs?:number};
const SAFE_CODE=/^[a-z0-9_.:-]{1,60}$/i;
/** Event-only, volatile turn ledger. No user messages or generated text can be passed into record(). */
export class TurnLedger {
 private buckets=new Map<string,LedgerEvent[]>();private sequence=0;
 constructor(private opts:{maxConversations?:number;maxEventsPerConversation?:number;ttlMs?:number}={}){}
 record(conversationId:string,event:Omit<LedgerEvent,'eventId'>):LedgerEvent|undefined {
  if(!/^[a-z0-9_-]{1,80}$/i.test(conversationId))return undefined;
  if(!Number.isFinite(event.at)||event.at<0||!['received','classified','local-answer','retrieval-answer','remote-attempt','remote-blocked','fallback','feedback','cleared'].includes(event.kind))return undefined;
  if(event.reasonCode&&!SAFE_CODE.test(event.reasonCode))return undefined;
  if(event.durationMs!==undefined&&(!Number.isFinite(event.durationMs)||event.durationMs<0||event.durationMs>300_000))return undefined;
  this.prune(event.at);let rows=this.buckets.get(conversationId);if(!rows){rows=[];this.buckets.set(conversationId,rows);}
  rows.push({...event,eventId:`e${(++this.sequence).toString(36)}`});const cap=this.opts.maxEventsPerConversation??40;if(rows.length>cap)rows.splice(0,rows.length-cap);
  while(this.buckets.size>(this.opts.maxConversations??100)){const first=this.buckets.keys().next().value as string|undefined;if(!first)break;this.buckets.delete(first);}
  return{...rows[rows.length-1]!};
 }
 list(conversationId:string,now=Date.now()):LedgerEvent[]{this.prune(now);return(this.buckets.get(conversationId)??[]).map(e=>({...e}));}
 counts(conversationId:string,now=Date.now()):Partial<Record<LedgerKind,number>>{const out:Partial<Record<LedgerKind,number>>={};for(const e of this.list(conversationId,now))out[e.kind]=(out[e.kind]??0)+1;return out;}
 clearConversation(conversationId:string):boolean{return this.buckets.delete(conversationId);}
 clearAll():void{this.buckets.clear();this.sequence=0;}
 conversationCount():number{return this.buckets.size;}
 prune(now=Date.now()):number{let removed=0;const ttl=this.opts.ttlMs??24*60*60_000;for(const [id,rows]of this.buckets){const keep=rows.filter(e=>now-e.at<=ttl);removed+=rows.length-keep.length;if(keep.length)this.buckets.set(id,keep);else this.buckets.delete(id);}return removed;}
}
