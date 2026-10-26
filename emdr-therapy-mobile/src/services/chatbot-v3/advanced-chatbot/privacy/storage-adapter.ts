export interface LocalKeyValueStore {
 get(key:string):Promise<string|undefined>;
 set(key:string,value:string):Promise<void>;
 remove(key:string):Promise<void>;
 clearNamespace(namespace:string):Promise<void>;
}
export type StoreEnvelope={schemaVersion:1;createdAt:number;expiresAt:number;payload:unknown};
export function encodeEnvelope(payload:unknown,ttlMs:number,now=Date.now()):string {
 if(!Number.isFinite(ttlMs)||ttlMs<0)throw new RangeError('ttlMs must be nonnegative');return JSON.stringify({schemaVersion:1,createdAt:now,expiresAt:now+ttlMs,payload} satisfies StoreEnvelope);
}
export function decodeEnvelope(text:string,now=Date.now()):StoreEnvelope|undefined {
 try{const raw=JSON.parse(text) as Record<string,unknown>;if(raw.schemaVersion!==1||typeof raw.createdAt!=='number'||typeof raw.expiresAt!=='number'||!('payload'in raw))return undefined;if(now>raw.expiresAt)return undefined;return raw as StoreEnvelope;}catch{return undefined;}
}
export function namespacedKey(namespace:string,key:string):string {
 if(!/^[a-z0-9_-]{1,40}$/i.test(namespace)||!/^[-a-z0-9_.]{1,120}$/i.test(key))throw new Error('Invalid storage key');return `${namespace}:${key}`;
}
