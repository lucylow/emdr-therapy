import { normalizeText, tokenize } from '../text.ts';
export type RepetitionResult={repeat:boolean;similarity:number;matchedId?:string};
type Entry={id:string;text:string;normalized:string;tokens:Set<string>;at:number};
function similarity(a:Set<string>,b:Set<string>):number{if(!a.size&&!b.size)return 1;const intersection=[...a].filter(x=>b.has(x)).length;const union=new Set([...a,...b]).size;return union?intersection/union:0;}
/** In-memory response repetition guard. Never stores user messages. */
export class ResponseRepetitionGuard {
 private entries:Entry[]=[];
 constructor(private opts:{capacity?:number;ttlMs?:number;threshold?:number;maxTextChars?:number}={}){}
 check(text:string,now=Date.now()):RepetitionResult {
   this.prune(now);const normalized=normalizeText(text).slice(0,this.opts.maxTextChars??1800);const tokens=new Set(tokenize(normalized));
   let best:Entry|undefined,bestScore=0;
   for(const e of this.entries){const score=e.normalized===normalized&&normalized?1:similarity(tokens,e.tokens);if(score>bestScore){best=e;bestScore=score;}}
   return {repeat:!!best&&bestScore>=(this.opts.threshold??0.88),similarity:bestScore,matchedId:best?.id};
 }
 add(id:string,text:string,now=Date.now()):void {
   this.prune(now);const clean=normalizeText(text).slice(0,this.opts.maxTextChars??1800);if(!clean)return;
   this.entries=this.entries.filter(e=>e.id!==id);this.entries.push({id,text:clean,normalized:clean,tokens:new Set(tokenize(clean)),at:now});
   const cap=Math.max(1,this.opts.capacity??8);if(this.entries.length>cap)this.entries=this.entries.slice(-cap);
 }
 clear():void{this.entries=[];}
 prune(now=Date.now()):number{const before=this.entries.length;this.entries=this.entries.filter(e=>now-e.at<=(this.opts.ttlMs??30*60_000));return before-this.entries.length;}
 size():number{return this.entries.length;}
}
export function chooseNonRepeatingResponse(candidate:string,fallback:string,guard:ResponseRepetitionGuard,turnId:string,now=Date.now()):{text:string;usedFallback:boolean;similarity:number}{
 const check=guard.check(candidate,now);const text=check.repeat?fallback:candidate;guard.add(turnId,text,now);return{text,usedFallback:check.repeat,similarity:check.similarity};
}
