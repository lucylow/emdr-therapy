import type { Intent, Locale } from '../types.ts';
export type TopicToken={intent:Intent;locale:Locale;at:number;turnIndex:number};
/** Stores only route labels and timestamps, never the originating user message. */
export class EphemeralTopicMemory {
  private history:TopicToken[]=[];
  constructor(private readonly maxItems=12,private readonly ttlMs=20*60_000){}
  push(token:TopicToken):void {this.history.push({...token});if(this.history.length>this.maxItems)this.history=this.history.slice(-this.maxItems);}
  latest(now=Date.now()):TopicToken|undefined {this.prune(now);const v=this.history.at(-1);return v?{...v}:undefined;}
  frequent(limit=3,now=Date.now()):Array<{intent:Intent;count:number}> {
    this.prune(now);const counts=new Map<Intent,number>();for(const row of this.history)counts.set(row.intent,(counts.get(row.intent)??0)+1);
    return [...counts].map(([intent,count])=>({intent,count})).sort((a,b)=>b.count-a.count||a.intent.localeCompare(b.intent)).slice(0,limit);
  }
  clear():void{this.history=[];}
  snapshot():TopicToken[]{return this.history.map(r=>({...r}));}
  private prune(now:number):void {this.history=this.history.filter(row=>now-row.at<=this.ttlMs);}
}
