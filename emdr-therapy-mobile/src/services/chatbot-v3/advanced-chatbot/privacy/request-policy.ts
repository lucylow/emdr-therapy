import type { ModelRequest } from '../types.ts';
import { auditOutboundText, redactSecrets } from './secret-scanner.ts';
import { hasPromptInjectionSignals } from '../text.ts';
export type RemotePolicyInput={request:ModelRequest;remoteConsent:boolean;providerEnabled:boolean;sendHistoryConsent:boolean;allowContext:boolean;maxPayloadChars?:number};
export type RemotePolicyResult={allowed:boolean;reasons:string[];request?:ModelRequest;removedContextCount:number};
/** A last-mile guard for opt-in remote fallback. The caller still owns legal notices and provider disclosure. */
export function enforceRemoteRequestPolicy(input:RemotePolicyInput):RemotePolicyResult {
 const reasons:string[]=[];if(!input.remoteConsent)reasons.push('remote-consent-required');if(!input.providerEnabled)reasons.push('provider-feature-disabled');
 // Context is stripped when consent is absent; lack of history consent is not itself a reason to deny a context-free request.
 if(!input.request.system.includes('You are not a therapist'))reasons.push('missing-bounded-system-policy');
 if(hasPromptInjectionSignals(input.request.user))reasons.push('possible-prompt-injection');
 const userAudit=auditOutboundText(input.request.user,{maxChars:input.maxPayloadChars??5000});if(!userAudit.ok)reasons.push(...userAudit.reasons);
 const systemAudit=auditOutboundText(input.request.system,{maxChars:8000});if(!systemAudit.ok)reasons.push('system-policy-invalid');
 const contextAllowed=input.allowContext&&input.sendHistoryConsent;
 const context=contextAllowed?input.request.context.map(m=>({role:m.role,content:redactSecrets(m.content).slice(0,1800)})):[];
 const request:ModelRequest={...input.request,user:input.request.user.slice(0,input.maxPayloadChars??5000),context};
 if(request.context.length>8)request.context=request.context.slice(-8);
 if(reasons.length)return{allowed:false,reasons:[...new Set(reasons)],removedContextCount:input.request.context.length};
 return{allowed:true,reasons:[],request,removedContextCount:input.request.context.length-context.length};
}
