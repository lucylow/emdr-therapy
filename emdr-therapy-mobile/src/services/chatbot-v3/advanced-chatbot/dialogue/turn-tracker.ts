import type { Intent, Locale } from '../types.ts';
import { EphemeralTopicMemory } from './topic-memory.ts';
export type TurnTrace={id:string;at:number;locale:Locale;intent:Intent;mode:'local-template'|'local-retrieval'|'remote-reviewed'|'safe-fallback';elapsedMs:number;outcome:'success'|'fallback'|'cancelled'|'error'};
/** Bounded operational trace excludes all message text and any stable user identifier. */
export class TurnTracker {
 private rows:TurnTrace[]=[];
 constructor(private readonly capacity=100,private readonly topics?:EphemeralTopicMemory){}
 record(row:TurnTrace):void {
  if(!Number.isFinite(row.at)||!Number.isFinite(row.elapsedMs)||row.elapsedMs<0)throw new Error('Invalid trace timing');
  if(!/^[a-z0-9_-]{1,80}$/i.test(row.id))throw new Error('Invalid trace ID');
  this.rows.push({...row});if(this.rows.length>this.capacity)this.rows=this.rows.slice(-this.capacity);
  this.topics?.push({intent:row.intent,locale:row.locale,at:row.at,turnIndex:this.rows.length});
 }
 recent(limit=10):TurnTrace[]{return this.rows.slice(-Math.max(0,limit)).map(r=>({...r}));}
 summary():{count:number;fallbackRate:number|null;remoteRate:number|null;medianLatencyMs:number|null} {
  if(!this.rows.length)return {count:0,fallbackRate:null,remoteRate:null,medianLatencyMs:null};
  const sorted=this.rows.map(r=>r.elapsedMs).sort((a,b)=>a-b);return {count:this.rows.length,fallbackRate:this.rows.filter(r=>r.outcome==='fallback').length/this.rows.length,remoteRate:this.rows.filter(r=>r.mode==='remote-reviewed').length/this.rows.length,medianLatencyMs:sorted[Math.floor((sorted.length-1)/2)]};
 }
 clear():void{this.rows=[];this.topics?.clear();}
}
