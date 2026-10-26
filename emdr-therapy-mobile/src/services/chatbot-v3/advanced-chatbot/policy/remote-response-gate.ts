import type { Locale, Source } from '../types.ts';
import { hasPromptInjectionSignals } from '../text.ts';
import { reviewGeneratedText } from './output-validator.ts';
import { lintGeneratedClaim } from './claim-linter.ts';
import { ReviewedCitationAllowlist } from '../knowledge/citation-allowlist.ts';

export type RemoteGateReason = 'remote-disabled'|'consent-missing'|'invalid-text'|'empty-text'|'unsafe-output'|'unsafe-claim'|'injection-output'|'citation-rejected';
export type RemoteGateResult = { accepted:boolean; text:string; sources:Source[]; reasons:RemoteGateReason[] };
export type RemoteGateInput = { text:unknown; locale:Locale; providerEnabled:boolean; userConsent:boolean; maxChars?:number; citationIds?:readonly unknown[]; citations?:ReviewedCitationAllowlist };

/** Last-mile response policy for any optional model provider. It never trusts generated citations by default. */
export function gateRemoteResponse(input:RemoteGateInput):RemoteGateResult {
  const reasons:RemoteGateReason[]=[];
  if(!input.providerEnabled)reasons.push('remote-disabled');
  if(!input.userConsent)reasons.push('consent-missing');
  if(typeof input.text!=='string')reasons.push('invalid-text');
  if(typeof input.text==='string'&&!input.text.trim())reasons.push('empty-text');
  if(reasons.length)return{accepted:false,text:'',sources:[],reasons};
  const review=reviewGeneratedText(input.text as string,input.maxChars??1800);
  if(!review.accepted)return{accepted:false,text:'',sources:[],reasons:['unsafe-output']};
  if(hasPromptInjectionSignals(review.text))return{accepted:false,text:'',sources:[],reasons:['injection-output']};
  const claims=lintGeneratedClaim(review.text,input.locale);
  if(!claims.safe)return{accepted:false,text:'',sources:[],reasons:['unsafe-claim']};
  let sources:Source[]=[];
  if(input.citationIds?.length){
    if(!input.citations)return{accepted:false,text:'',sources:[],reasons:['citation-rejected']};
    const resolved=input.citations.resolve(input.citationIds,input.locale);
    if(resolved.rejectedIds.length)return{accepted:false,text:'',sources:[],reasons:['citation-rejected']};
    sources=resolved.accepted;
  }
  return{accepted:true,text:claims.cleanText,sources,reasons:[]};
}
