import type { Intent, RiskSignal } from '../types.ts';
export type RemoteEligibilityInput={remoteFeatureEnabled:boolean;remoteConsent:boolean;sendHistoryConsent:boolean;hasHistory:boolean;localOnly:boolean;intent:Intent;confidence:number;risk:RiskSignal;diagnosisRequest:boolean;medicationBoundary?:boolean;traumaProcessingBoundary?:boolean;promptInjection:boolean;localAnswerAvailable:boolean;privacyRequest?:boolean;directControl?:boolean};
export type RemoteEligibility={allowed:boolean;reasons:string[];contextAllowed:boolean;maxOutputTokens:number};
/** Remote generation is a last resort. A remote request is never needed for controls or high-risk paths. */
export function evaluateRemoteEligibility(input:RemoteEligibilityInput):RemoteEligibility {
 const reasons:string[]=[];
 if(!input.remoteFeatureEnabled)reasons.push('remote-feature-disabled');
 if(!input.remoteConsent)reasons.push('remote-consent-missing');
 if(input.localOnly)reasons.push('local-only-turn');
 if(input.risk!=='none')reasons.push('risk-route-local');
 if(input.diagnosisRequest||input.medicationBoundary||input.traumaProcessingBoundary)reasons.push('clinical-boundary-local');
 if(input.promptInjection)reasons.push('possible-injection');
 if(input.privacyRequest)reasons.push('privacy-route-local');
 if(input.directControl)reasons.push('control-route-local');
 if(input.localAnswerAvailable)reasons.push('local-answer-available');
 if(input.intent!=='unknown')reasons.push('known-intent-local');
 if(!Number.isFinite(input.confidence)||input.confidence<0||input.confidence>1)reasons.push('invalid-confidence');
 if(input.confidence>=0.45)reasons.push('confidence-too-high-for-remote-fallback');
 const allowed=reasons.length===0;const contextAllowed=allowed&&input.hasHistory&&input.sendHistoryConsent;
 return{allowed,reasons,contextAllowed,maxOutputTokens:allowed?280:0};
}
