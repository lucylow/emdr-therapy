export type RetainedDataScope='turn-context'|'preferences'|'metrics'|'cached-answers'|'consent-receipts';
export type RetentionRegistration={scope:RetainedDataScope;maxAgeMs:number;pruneExpired:(now:number,maxAgeMs:number)=>void|Promise<void>};
export type RetentionSweepReport={checked:number;cleared:RetainedDataScope[];failed:RetainedDataScope[];errors:string[]};
const SCOPES:RetainedDataScope[]=['turn-context','preferences','metrics','cached-answers','consent-receipts'];
/** Explicit sweep controller: host calls sweep during startup, resume, logout, or privacy action. No hidden timer. */
export class RetentionController{
 private readonly stores=new Map<RetainedDataScope,RetentionRegistration>();
 private lastSweep=0;
 register(input:RetentionRegistration):void{if(!SCOPES.includes(input.scope)||!Number.isFinite(input.maxAgeMs)||input.maxAgeMs<1000||input.maxAgeMs>2*365*86400_000)throw new Error('Invalid retention registration');this.stores.set(input.scope,{...input});}
 async sweep(now=Date.now(),options:{force?:boolean;minimumIntervalMs?:number}={}):Promise<RetentionSweepReport>{
  if(!Number.isFinite(now)||now<0)throw new Error('Invalid sweep timestamp');const interval=clamp(options.minimumIntervalMs??60_000,0,86400_000);if(!options.force&&this.lastSweep&&now-this.lastSweep<interval)return{checked:0,cleared:[],failed:[],errors:['sweep-throttled']};this.lastSweep=now;
  const cleared:RetainedDataScope[]=[],failed:RetainedDataScope[]=[],errors:string[]=[];
  for(const scope of SCOPES){const row=this.stores.get(scope);if(!row)continue;try{await row.pruneExpired(now,row.maxAgeMs);cleared.push(scope);}catch(e){failed.push(scope);errors.push(`${scope}:${e instanceof Error?e.name:'unknown-error'}`);}}
  return{checked:this.stores.size,cleared,failed,errors};
 }
 unregister(scope:RetainedDataScope):boolean{return this.stores.delete(scope);}
 scopes():RetainedDataScope[]{return [...this.stores.keys()];}
 clearRegistrations():void{this.stores.clear();this.lastSweep=0;}
}
export function validRetentionScope(value:unknown):value is RetainedDataScope{return typeof value==='string'&&SCOPES.includes(value as RetainedDataScope);}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
