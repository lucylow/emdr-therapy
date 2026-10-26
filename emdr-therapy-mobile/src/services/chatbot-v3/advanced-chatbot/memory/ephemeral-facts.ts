export type FactKind = 'preference'|'pending-goal'|'locale'|'accessibility';
export type SafeFact = { key:string; value:string|number|boolean; kind:FactKind; confidence:number; createdAt:number; expiresAt:number; userConfirmed:boolean };
const FORBIDDEN_KEYS = /trauma|diagnos|symptom|medication|password|secret|email|phone|address|transcript|reflection|free.?text|risk|self.?harm/i;
const KEY=/^[a-z][a-z0-9_.-]{0,39}$/i;
/** Bounded in-memory facts only. No arbitrary text fields and no disk adapter by design. */
export class EphemeralFactStore {
 private readonly facts=new Map<string,SafeFact>();
 constructor(private readonly opts:{maxFacts?:number;ttlMs?:number;minConfidence?:number}={}){}
 put(fact:SafeFact,consent:boolean):boolean {
   if(!consent||!KEY.test(fact.key)||FORBIDDEN_KEYS.test(fact.key)||!Number.isFinite(fact.confidence)||fact.confidence<(this.opts.minConfidence??0.75)||!Number.isFinite(fact.createdAt)||!Number.isFinite(fact.expiresAt)||fact.expiresAt<=fact.createdAt)return false;
   if(typeof fact.value==='string'&&(fact.value.length>80||/[\r\n<>]/.test(fact.value)))return false;
   if(typeof fact.value==='number'&&!Number.isFinite(fact.value))return false;
   if(!fact.userConfirmed&&fact.kind!=='pending-goal')return false;
   this.prune(fact.createdAt);
   const max=this.opts.maxFacts??32;
   if(!this.facts.has(fact.key)&&this.facts.size>=max){const oldest=[...this.facts.values()].sort((a,b)=>a.createdAt-b.createdAt)[0];if(oldest)this.facts.delete(oldest.key);}
   this.facts.set(fact.key,{...fact,value:fact.value});return true;
 }
 get(key:string,now=Date.now()):SafeFact|undefined {this.prune(now);const f=this.facts.get(key);return f?{...f}:undefined;}
 list(now=Date.now()):SafeFact[]{this.prune(now);return [...this.facts.values()].map(f=>({...f}));}
 forget(key:string):boolean{return this.facts.delete(key);}
 clear():void{this.facts.clear();}
 prune(now=Date.now()):number{let n=0;for(const [k,v] of this.facts){if(v.expiresAt<=now){this.facts.delete(k);n++;}}return n;}
 size():number{return this.facts.size;}
}
export function summarizeFactsForPrompt(facts:SafeFact[],now=Date.now()):string {
 const allowed=facts.filter(f=>f.userConfirmed&&f.expiresAt>now&&KEY.test(f.key)&&!FORBIDDEN_KEYS.test(f.key)).slice(0,12);
 if(!allowed.length)return '';
 return 'User-confirmed preferences only (not clinical history):\n'+allowed.map(f=>`- ${f.key}: ${String(f.value).slice(0,80)}`).join('\n');
}
