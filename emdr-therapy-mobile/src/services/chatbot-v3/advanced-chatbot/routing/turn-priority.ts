import type { Intent, Locale, RiskSignal } from '../types.ts';
export type TurnFacts={risk:RiskSignal;diagnosis:boolean;medicationBoundary?:boolean;traumaProcessingBoundary?:boolean;promptInjection:boolean;directControl?:'pause'|'resume'|'stop';privacyRequest:boolean;localKnowledgeAvailable:boolean;remoteConsent:boolean;providerEnabled:boolean;localOnly:boolean;intent:Intent};
export type RouteDecision={route:'safety'|'clinical-boundary'|'direct-control'|'privacy'|'local-knowledge'|'remote-provider'|'local-template'|'clarification';reason:string[];mayUseProvider:boolean};
/** A deterministic route order; use before any model/provider call. */
export function selectTurnRoute(f:TurnFacts):RouteDecision {
 if(f.risk!=='none')return{route:'safety',reason:['risk-precedence','local-only'],mayUseProvider:false};
 if(f.diagnosis||f.medicationBoundary||f.traumaProcessingBoundary)return{route:'clinical-boundary',reason:['clinical-boundary-precedence','local-only'],mayUseProvider:false};
 if(f.directControl)return{route:'direct-control',reason:['host-control-precedence','no-generated-control'],mayUseProvider:false};
 if(f.privacyRequest)return{route:'privacy',reason:['privacy-data-request','local-only'],mayUseProvider:false};
 if(f.promptInjection)return{route:'local-template',reason:['untrusted-instruction','provider-blocked'],mayUseProvider:false};
 if(f.localKnowledgeAvailable)return{route:'local-knowledge',reason:['reviewed-local-answer-preferred'],mayUseProvider:false};
 if(f.intent==='unknown'&&f.remoteConsent&&f.providerEnabled&&!f.localOnly)return{route:'remote-provider',reason:['explicit-remote-consent','unknown-intent'],mayUseProvider:true};
 if(f.intent==='unknown')return{route:'clarification',reason:['uncertain-intent','provider-not-authorized'],mayUseProvider:false};
 return{route:'local-template',reason:['known-intent-local-template'],mayUseProvider:false};
}
export function routeAllowsProvider(decision:RouteDecision):boolean{return decision.route==='remote-provider'&&decision.mayUseProvider;}
