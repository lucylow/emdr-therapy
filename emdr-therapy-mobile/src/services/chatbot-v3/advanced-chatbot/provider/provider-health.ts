export type ProviderHealthState='closed'|'open'|'half-open';
export type ProviderHealthSnapshot={state:ProviderHealthState;failures:number;successes:number;lastFailureAt?:number;openedAt?:number;nextProbeAt?:number};
/** Process-local circuit breaker health model. Do not persist prompts or user content in this class. */
export class ProviderHealth {
 private state:ProviderHealthState='closed';private failures=0;private successes=0;private lastFailureAt?:number;private openedAt?:number;private probeInFlight=false;
 constructor(private opts:{failureThreshold?:number;cooldownMs?:number;successesToClose?:number}={}){}
 canRequest(now=Date.now()):boolean {if(this.state==='closed')return true;if(this.state==='open'){if(now-(this.openedAt??now)>=(this.opts.cooldownMs??15_000)){this.state='half-open';this.probeInFlight=false;}else return false;}if(this.state==='half-open'){if(this.probeInFlight)return false;this.probeInFlight=true;return true;}return false;}
 recordSuccess(now=Date.now()):void{this.successes++;if(this.state==='half-open'){this.state='closed';this.failures=0;this.openedAt=undefined;this.probeInFlight=false;}else if(this.state==='closed')this.failures=Math.max(0,this.failures-1);}
 recordFailure(now=Date.now()):void{this.failures++;this.lastFailureAt=now;if(this.state==='half-open'||this.failures>=(this.opts.failureThreshold??3)){this.state='open';this.openedAt=now;this.probeInFlight=false;}}
 reset():void{this.state='closed';this.failures=0;this.successes=0;this.lastFailureAt=undefined;this.openedAt=undefined;this.probeInFlight=false;}
 snapshot(now=Date.now()):ProviderHealthSnapshot{return{state:this.state,failures:this.failures,successes:this.successes,lastFailureAt:this.lastFailureAt,openedAt:this.openedAt,nextProbeAt:this.state==='open'?(this.openedAt??now)+(this.opts.cooldownMs??15_000):undefined};}
}
export async function withProviderHealth<T>(health:ProviderHealth,operation:()=>Promise<T>,now=Date.now()):Promise<{ok:true;value:T}|{ok:false;reason:'circuit-open'|'provider-error'}>{if(!health.canRequest(now))return{ok:false,reason:'circuit-open'};try{const value=await operation();health.recordSuccess(now);return{ok:true,value};}catch{return{ok:false,reason:'provider-error'};}}
