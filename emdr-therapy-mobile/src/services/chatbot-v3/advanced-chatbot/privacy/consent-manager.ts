export type ConsentScope='remote-processing'|'send-history'|'store-preferences'|'store-transcript'|'aggregate-analytics';
export type ConsentGrant={scope:ConsentScope;granted:boolean;source:'settings-screen'|'per-turn-dialog';grantedAt:number;expiresAt:number};
export class ConsentManager {
 private grants=new Map<string,ConsentGrant>();
 constructor(private readonly maxAgeMs=30*60_000,private readonly maxScopes=5){}
 grant(scope:ConsentScope,granted:boolean,source:ConsentGrant['source'],now=Date.now()):ConsentGrant {
  if(!['remote-processing','send-history','store-preferences','store-transcript','aggregate-analytics'].includes(scope))throw new Error('Unknown consent scope');
  if(scope==='remote-processing'&&source!=='per-turn-dialog')throw new Error('Remote processing must require per-turn confirmation');
  const row={scope,granted,source,grantedAt:now,expiresAt:now+this.maxAgeMs};this.grants.set(scope,row);while(this.grants.size>this.maxScopes)this.grants.delete(this.grants.keys().next().value as string);return {...row};
 }
 has(scope:ConsentScope,now=Date.now()):boolean {const row=this.grants.get(scope);if(!row)return false;if(now>row.expiresAt){this.grants.delete(scope);return false;}return row.granted;}
 requireRemoteTurnConsent(now=Date.now()):boolean {return this.has('remote-processing',now);}
 revoke(scope:ConsentScope):void{this.grants.delete(scope);if(scope==='remote-processing')this.grants.delete('send-history');}
 revokeAll():void{this.grants.clear();}
 snapshot(now=Date.now()):ConsentGrant[]{this.prune(now);return [...this.grants.values()].map(g=>({...g}));}
 prune(now=Date.now()):number{let n=0;for(const [scope,row] of this.grants)if(now>row.expiresAt){this.grants.delete(scope);n++;}return n;}
}
