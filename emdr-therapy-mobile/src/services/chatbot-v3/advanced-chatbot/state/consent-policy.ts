export type ConsentPolicyScope='remote-processing'|'history-context'|'analytics'|'personalization'|'local-storage';
export type ConsentPolicyGrant={scope:ConsentPolicyScope;granted:boolean;at:number;expiresAt:number;source:'settings'|'per-turn'|'onboarding';version:1};
const SCOPES=new Set<ConsentPolicyScope>(['remote-processing','history-context','analytics','personalization','local-storage']);
/** Timestamped consent primitives. Missing, expired, or malformed grants always mean no consent. */
export class ConsentPolicy {
 private grants=new Map<ConsentPolicyScope,ConsentPolicyGrant>();
 grant(scope:string,granted:boolean,now=Date.now(),ttlMs=30*24*60*60_000,source:ConsentPolicyGrant['source']='settings'):boolean {if(!SCOPES.has(scope as ConsentPolicyScope)||!Number.isFinite(now)||!Number.isFinite(ttlMs)||ttlMs<0||ttlMs>365*24*60*60_000)return false;const c=scope as ConsentPolicyScope;this.grants.set(c,{scope:c,granted,at:now,expiresAt:now+ttlMs,source,version:1});return true;}
 has(scope:ConsentPolicyScope,now=Date.now()):boolean{const g=this.grants.get(scope);return!!g&&g.granted&&Number.isFinite(g.expiresAt)&&g.expiresAt>now;}
 get(scope:ConsentPolicyScope,now=Date.now()):ConsentPolicyGrant|undefined{const g=this.grants.get(scope);if(!g||g.expiresAt<=now)return undefined;return{...g};}
 revoke(scope:ConsentPolicyScope):boolean{const g=this.grants.get(scope);if(!g)return false;this.grants.set(scope,{...g,granted:false,expiresAt:0});return true;}
 revokeAll():void{for(const [scope,g]of this.grants)this.grants.set(scope,{...g,granted:false,expiresAt:0});}
 prune(now=Date.now()):number{let count=0;for(const [scope,g]of this.grants){if(g.expiresAt<=now){this.grants.delete(scope);count++;}}return count;}
 list(now=Date.now()):ConsentPolicyGrant[]{this.prune(now);return[...this.grants.values()].map(g=>({...g}));}
}
export function canIncludeHistory(consent:ConsentPolicy,now=Date.now()):boolean{return consent.has('remote-processing',now)&&consent.has('history-context',now);}
