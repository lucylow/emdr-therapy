import { validateHostAction, type HostAction, type HostActionId, type HostCapabilities } from './action-contract.ts';
import { ConfirmationTokenStore } from './confirmation-tokens.ts';
export type ActionProposalOutcome={ok:true;token:string;actionId:HostActionId;label:string;parameters:Record<string,string|number|boolean>;expiresAt:number}|{ok:false;reason:'unsupported-capability'|'invalid-parameters'|'out-of-range'|'unknown-action'|'direct-control-uses-host-path'};
export type ActionConfirmationOutcome={ok:true;proposal:HostAction;dispatchRequired:true}|{ok:false;reason:'unknown-token'|'expired'|'wrong-action'|'already-used'|'cancelled'|'host-capability-changed'|'proposal-not-found'};
type Pending={token:string;action:HostAction;expiresAt:number};
const DIRECT=new Set<HostActionId>(['stop','pause','resume']);
/** Confirmation transaction for optional UI actions. It returns a validated proposal; it never invokes app callbacks. */
export class ActionConfirmationFlow{
 private readonly tokens:ConfirmationTokenStore;private readonly pending=new Map<string,Pending>();
 constructor(private readonly options:{ttlMs?:number;capacity?:number}={}){this.tokens=new ConfirmationTokenStore({ttlMs:options.ttlMs,capacity:options.capacity});}
 propose(input:{id:string;parameters:unknown;label:string;capabilities:HostCapabilities;now?:number}):ActionProposalOutcome{
  if(['stop','pause','resume'].includes(input.id))return{ok:false,reason:'direct-control-uses-host-path'};
  const checked=validateHostAction(input.id,input.parameters,input.capabilities,true);
  if(!checked.ok)return{ok:false,reason:checked.reason==='confirmation-required'?'invalid-parameters':checked.reason};
  const now=input.now??Date.now();const token=this.tokens.propose({actionId:checked.action.id,label:input.label,now});
  this.pending.set(token.token,{token:token.token,action:checked.action,expiresAt:token.expiresAt});
  while(this.pending.size>clamp(this.options.capacity??100,1,1000))this.pending.delete(this.pending.keys().next().value as string);
  return{ok:true,token:token.token,actionId:checked.action.id,label:token.label,parameters:{...checked.action.parameters},expiresAt:token.expiresAt};
 }
 confirm(token:string,actionId:HostActionId,capabilities:HostCapabilities,now=Date.now()):ActionConfirmationOutcome{
  const entry=this.pending.get(token);if(!entry)return{ok:false,reason:'proposal-not-found'};
  if(entry.expiresAt<now){this.pending.delete(token);this.tokens.cancel(token);return{ok:false,reason:'expired'};}
  const confirmed=this.tokens.confirm(token,actionId,now);
  if(!confirmed.accepted){this.pending.delete(token);return{ok:false,reason:confirmed.reason==='unknown-token'?'unknown-token':confirmed.reason==='expired'?'expired':confirmed.reason==='wrong-action'?'wrong-action':confirmed.reason==='already-used'?'already-used':'cancelled'};}
  this.pending.delete(token);
  const rechecked=validateHostAction(entry.action.id,entry.action.parameters,capabilities,true);
  if(!rechecked.ok)return{ok:false,reason:'host-capability-changed'};
  return{ok:true,proposal:rechecked.action,dispatchRequired:true};
 }
 cancel(token:string):boolean{this.pending.delete(token);const r=this.tokens.cancel(token);return r.reason==='cancelled';}
 clear():void{this.pending.clear();this.tokens.clear();}
 get size():number{return this.pending.size;}
}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
