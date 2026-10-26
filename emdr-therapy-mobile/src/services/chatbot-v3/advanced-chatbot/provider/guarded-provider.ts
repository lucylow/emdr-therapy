import type { ChatModelProvider, Locale, ModelRequest, ModelResult } from '../types.ts';
import { redactSensitiveText, clampText, hasPromptInjectionSignals } from '../text.ts';
import { reviewGeneratedText } from '../policy/output-validator.ts';
import { lintGeneratedClaim } from '../policy/claim-linter.ts';

export type GuardedProviderCode = 'disabled'|'consent-missing'|'invalid-request'|'payload-too-large'|'context-not-allowed'|'timeout'|'cancelled'|'provider-error'|'unsafe-output';
export class GuardedProviderError extends Error { constructor(readonly code:GuardedProviderCode){super(code);this.name='GuardedProviderError';} }
export type GuardedProviderOptions={enabled?:boolean;hasConsent?:()=>boolean;hasHistoryConsent?:()=>boolean;allowHistory?:boolean;timeoutMs?:number;maxRequestChars?:number;maxOutputChars?:number;providerLabel?:string;now?:()=>number};

/** Optional provider wrapper for host apps that need a final last-mile validation boundary.
 * Does not log prompts, does not retain conversations, and fails closed on provider errors. */
export class GuardedChatModelProvider implements ChatModelProvider {
 constructor(private readonly delegate:ChatModelProvider,private readonly options:GuardedProviderOptions={}){}
 async generate(request:ModelRequest,signal?:AbortSignal):Promise<ModelResult>{
  if(this.options.enabled!==true)throw new GuardedProviderError('disabled');
  if(this.options.hasConsent?.()!==true)throw new GuardedProviderError('consent-missing');
  if(signal?.aborted)throw new GuardedProviderError('cancelled');
  const prepared=this.prepare(request);if(!prepared.ok)throw new GuardedProviderError(prepared.reason);
  const ctl=new AbortController();const onAbort=()=>ctl.abort();signal?.addEventListener('abort',onAbort,{once:true});
  const timeoutMs=clamp(this.options.timeoutMs??12_000,100,60_000);const start=(this.options.now??Date.now)();let timer:ReturnType<typeof setTimeout>|undefined;
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{ctl.abort();reject(new GuardedProviderError('timeout'));},timeoutMs);});
  const cancelled=new Promise<never>((_,reject)=>{ctl.signal.addEventListener('abort',()=>reject(new GuardedProviderError(signal?.aborted?'cancelled':'timeout')),{once:true});});
  try{
   const raw=await Promise.race([this.delegate.generate(prepared.request,ctl.signal),timeout,cancelled]);
   if(typeof raw?.text!=='string'||raw.text.length===0)throw new GuardedProviderError('provider-error');
   const maxOutput=clamp(this.options.maxOutputChars??1800,100,6000);const reviewed=reviewGeneratedText(raw.text,maxOutput);const claim=reviewed.accepted?lintGeneratedClaim(reviewed.text,prepared.request.locale):undefined;
   if(!reviewed.accepted||!claim?.safe||hasPromptInjectionSignals(reviewed.text))throw new GuardedProviderError('unsafe-output');
   const provider=this.options.providerLabel??'guarded-provider';
   return{text:clampText(claim.cleanText,maxOutput),provider:provider.replace(/[^a-z0-9._-]/gi,'').slice(0,60)||'guarded-provider',latencyMs:clamp((this.options.now??Date.now)()-start,0,300_000)};
  }catch(error){if(error instanceof GuardedProviderError)throw error;if(signal?.aborted)throw new GuardedProviderError('cancelled');if(ctl.signal.aborted)throw new GuardedProviderError('timeout');throw new GuardedProviderError('provider-error');}
  finally{if(timer)clearTimeout(timer);signal?.removeEventListener('abort',onAbort);}
 }
 private prepare(request:ModelRequest):{ok:true;request:ModelRequest}|{ok:false;reason:'invalid-request'|'payload-too-large'|'context-not-allowed'}{
  if(!request||!['en','fr','es'].includes(request.locale)||typeof request.system!=='string'||typeof request.user!=='string'||!request.system.includes('You are not a therapist')||request.maxOutputTokens<32||request.maxOutputTokens>900)return{ok:false,reason:'invalid-request'};
  if(request.context.length&&(this.options.allowHistory!==true||this.options.hasHistoryConsent?.()!==true))return{ok:false,reason:'context-not-allowed'};
  if(request.context.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>1200))return{ok:false,reason:'invalid-request'};
  const maxRequest=clamp(this.options.maxRequestChars??8000,1000,20000);const system=clampText(request.system,4000);const user=redactSensitiveText(clampText(request.user,5000));
  if(system.length+user.length+request.context.reduce((n,m)=>n+m.content.length,0)>maxRequest)return{ok:false,reason:'payload-too-large'};
  if(hasPromptInjectionSignals(user))return{ok:false,reason:'invalid-request'};
  const context=this.options.allowHistory===true?request.context.slice(-6).map(m=>({role:m.role,content:redactSensitiveText(clampText(m.content,1200))})):[];
  return{ok:true,request:{system,user,context,locale:request.locale,maxOutputTokens:Math.min(500,request.maxOutputTokens)}};
 }
}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
