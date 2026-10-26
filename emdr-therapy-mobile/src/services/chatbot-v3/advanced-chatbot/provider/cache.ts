import { stableHash } from '../text.ts';
export type CacheRecord<T>={value:T;expiresAt:number};
/** Memory-only LRU cache. Keys are hashes; no original query is retained by the map. */
export class LocalResponseCache<T> {
  private readonly records=new Map<string,CacheRecord<T>>();
  constructor(private readonly capacity=100,private readonly ttlMs=30_000){}
  key(parts:readonly string[]):string{return stableHash(parts.join('\u241f'));}
  get(parts:readonly string[],now=Date.now()):T|undefined {
    const key=this.key(parts);const hit=this.records.get(key);if(!hit)return undefined;
    if(now>hit.expiresAt){this.records.delete(key);return undefined;}
    this.records.delete(key);this.records.set(key,hit);return clone(hit.value);
  }
  set(parts:readonly string[],value:T,now=Date.now()):void {
    if(this.capacity===0)return;const key=this.key(parts);this.records.delete(key);this.records.set(key,{value:clone(value),expiresAt:now+this.ttlMs});
    while(this.records.size>this.capacity)this.records.delete(this.records.keys().next().value as string);
  }
  clear():void{this.records.clear();}
  prune(now=Date.now()):number{let n=0;for(const [key,record] of this.records)if(now>record.expiresAt){this.records.delete(key);n++;}return n;}
  get size():number{return this.records.size;}
}
function clone<T>(value:T):T {if(value===null||typeof value!=='object')return value;return structuredClone(value);}
