export type DataCategory='raw-message'|'topic-label'|'preference'|'aggregate-metric'|'provider-payload';
export type RetentionPolicy={category:DataCategory;enabled:boolean;ttlMs:number;requiresConsent:boolean;persistByDefault:boolean};
export const DEFAULT_RETENTION:readonly RetentionPolicy[]=Object.freeze([
 {category:'raw-message',enabled:false,ttlMs:0,requiresConsent:true,persistByDefault:false},
 {category:'topic-label',enabled:true,ttlMs:20*60_000,requiresConsent:false,persistByDefault:false},
 {category:'preference',enabled:true,ttlMs:365*24*60*60_000,requiresConsent:true,persistByDefault:false},
 {category:'aggregate-metric',enabled:false,ttlMs:30*24*60*60_000,requiresConsent:true,persistByDefault:false},
 {category:'provider-payload',enabled:false,ttlMs:0,requiresConsent:true,persistByDefault:false},
]);
export function validateRetentionPolicy(policy:RetentionPolicy):string[]{const e:string[]=[];if(policy.ttlMs<0||!Number.isFinite(policy.ttlMs))e.push('invalid-ttl');if(policy.persistByDefault&&policy.requiresConsent)e.push('consent-required-before-persisting');if(!policy.enabled&&policy.ttlMs!==0&&policy.category==='raw-message')e.push('disabled-raw-message-ttl-should-be-zero');return e;}
export function canStore(category:DataCategory,policies:readonly RetentionPolicy[]=DEFAULT_RETENTION,consent=false):boolean {const p=policies.find(x=>x.category===category);return !!p?.enabled&&(!p.requiresConsent||consent)&&p.persistByDefault;}
export function expiresAt(createdAt:number,ttlMs:number):number {if(!Number.isFinite(createdAt)||!Number.isFinite(ttlMs)||ttlMs<0)throw new RangeError('invalid retention interval');return createdAt+ttlMs;}
