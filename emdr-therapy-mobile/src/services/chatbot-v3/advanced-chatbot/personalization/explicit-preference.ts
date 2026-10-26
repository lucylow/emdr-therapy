export type PreferenceKey='replyLength'|'tone'|'locale'|'reducedMotion'|'audioEnabled'|'groundingSuggestions';
export type PreferenceValue=string|boolean;
export type PreferenceProposal={key:PreferenceKey;value:PreferenceValue;proposalId:string;createdAt:number;expiresAt:number;source:'user-explicit'|'user-approved-inference';reasonCode:string};
const ALLOWED:Record<PreferenceKey,Set<string>>={replyLength:new Set(['short','standard','detailed']),tone:new Set(['warm','neutral','concise']),locale:new Set(['en','fr','es']),reducedMotion:new Set(['true','false']),audioEnabled:new Set(['true','false']),groundingSuggestions:new Set(['true','false'])};
export class ExplicitPreferenceManager {
 private proposals=new Map<string,PreferenceProposal>();private values=new Map<PreferenceKey,PreferenceValue>();
 propose(key:string,value:PreferenceValue,now=Date.now(),reasonCode='explicit-request'):PreferenceProposal|undefined {if(!(key in ALLOWED)||!ALLOWED[key as PreferenceKey].has(String(value))||!Number.isFinite(now)||!/^([a-z0-9-]{1,50})$/i.test(reasonCode))return undefined;const id=`p${now.toString(36)}-${Math.random().toString(36).slice(2,8)}`;const proposal:PreferenceProposal={key:key as PreferenceKey,value,proposalId:id,createdAt:now,expiresAt:now+10*60_000,source:'user-explicit',reasonCode};this.proposals.set(id,proposal);while(this.proposals.size>20)this.proposals.delete(this.proposals.keys().next().value!);return{...proposal};}
 confirm(id:string,confirmed:boolean,now=Date.now()):{applied:boolean;key?:PreferenceKey;value?:PreferenceValue;reason:string}{const p=this.proposals.get(id);this.proposals.delete(id);if(!p)return{applied:false,reason:'proposal-not-found'};if(p.expiresAt<=now)return{applied:false,reason:'proposal-expired'};if(!confirmed)return{applied:false,reason:'user-declined'};this.values.set(p.key,p.value);return{applied:true,key:p.key,value:p.value,reason:'user-confirmed'};}
 get(key:PreferenceKey):PreferenceValue|undefined{return this.values.get(key);}
 list():Array<{key:PreferenceKey;value:PreferenceValue}>{return[...this.values.entries()].map(([key,value])=>({key,value}));}
 forget(key?:PreferenceKey):void{if(key)this.values.delete(key);else this.values.clear();}
 expire(now=Date.now()):number{let n=0;for(const [id,p]of this.proposals){if(p.expiresAt<=now){this.proposals.delete(id);n++;}}return n;}
 pendingCount():number{return this.proposals.size;}
}
