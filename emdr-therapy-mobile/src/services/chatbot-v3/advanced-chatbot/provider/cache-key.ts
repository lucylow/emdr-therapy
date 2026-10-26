import type { Locale } from '../types.ts';
import { normalizeText, stableHash, hasPromptInjectionSignals } from '../text.ts';
import { scanSecrets } from '../privacy/secret-scanner.ts';

export type SafeCacheInput={query:string;locale:Locale;knowledgeVersion:string;mode:'local-retrieval'|'remote-reviewed';consentToCache:boolean;personalDataPossible?:boolean};
export type CacheEntry<T>={key:string;value:T;createdAt:number;expiresAt:number;sourceVersion:string};
/** Produces cache keys only for consented, non-sensitive queries and a known reviewed-source version. */
export function makeSafeCacheKey(input:SafeCacheInput):string|undefined {
 if(!input.consentToCache||input.personalDataPossible||hasPromptInjectionSignals(input.query)||scanSecrets(input.query).length)return undefined;
 const query=normalizeText(input.query);if(query.length<3||query.length>500||!/[\p{L}\p{N}]/u.test(query))return undefined;
 if(!/^[a-z0-9._-]{1,60}$/i.test(input.knowledgeVersion))return undefined;
 // A one-way hash prevents raw search text from becoming a cache key or metric dimension.
 return `chat:${input.mode}:${input.locale}:${input.knowledgeVersion}:${stableHash(query)}`;
}
export class SafeResponseCache<T> {
 private entries=new Map<string,CacheEntry<T>>();
 constructor(private opts:{maxEntries?:number;ttlMs?:number}={}){}
 get(key:string,now=Date.now(),sourceVersion?:string):T|undefined {const e=this.entries.get(key);if(!e)return undefined;if(e.expiresAt<=now||sourceVersion&&e.sourceVersion!==sourceVersion){this.entries.delete(key);return undefined;}return cloneValue(e.value);}
 set(key:string,value:T,sourceVersion:string,now=Date.now(),consented=false):boolean {if(!consented||!/^chat:(?:local-retrieval|remote-reviewed):(en|fr|es):[a-z0-9._-]{1,60}:[a-f0-9]{8}$/i.test(key)||!/^[a-z0-9._-]{1,60}$/i.test(sourceVersion))return false;const cap=Math.max(0,Math.min(5000,this.opts.maxEntries??128));if(cap===0)return false;this.entries.set(key,{key,value:cloneValue(value),sourceVersion,createdAt:now,expiresAt:now+(this.opts.ttlMs??5*60_000)});while(this.entries.size>cap){const first=this.entries.keys().next().value as string|undefined;if(!first)break;this.entries.delete(first);}return true;}
 delete(key:string):boolean{return this.entries.delete(key);}clear():void{this.entries.clear();}size():number{return this.entries.size;}prune(now=Date.now()):number{let n=0;for(const [key,e]of this.entries){if(e.expiresAt<=now){this.entries.delete(key);n++;}}return n;}
}
function cloneValue<T>(value:T):T {if(value&&typeof value==='object'){if(Array.isArray(value))return value.map(cloneValue) as T;return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,cloneValue(v)])) as T;}return value;}
