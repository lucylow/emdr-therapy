import type { ChatResponse, Source } from '../types.ts';
import { reviewGeneratedText, safeFallback } from './output-validator.ts';
import { lintGeneratedClaim } from './claim-linter.ts';
import { validateCitations } from '../knowledge/citation-integrity.ts';
import { auditResponseSafety } from './safety-invariants.ts';
import { contractFallback, checkResponseContract } from '../experience/response-contract.ts';

export type ProviderOutputAudit={response:ChatResponse;accepted:boolean;reasons:string[];discardedSourceCount:number;discardedSuggestionCount:number};
export type ProviderOutputAuditOptions={availableSources:Source[];remoteConsent:boolean;hostActionIds?:string[];maxOutputChars?:number};
/** Post-generation gate. It sanitizes proposals, never dispatches actions, and falls back on any critical violation. */
export function auditProviderOutput(candidate:ChatResponse,options:ProviderOutputAuditOptions):ProviderOutputAudit {
 const reasons:string[]=[];let response={...candidate};
 const reviewed=reviewGeneratedText(response.text,options.maxOutputChars??1800);
 if(!reviewed.accepted){reasons.push(...reviewed.reasons);response={...response,text:safeFallback(response.locale),mode:'safe-fallback',sources:[],suggestions:[],safetySignal:response.safetySignal};}
 else response.text=reviewed.text;
 const claims=lintGeneratedClaim(response.text,response.locale);
 if(!claims.safe){reasons.push(...claims.issues);response={...response,text:claims.cleanText,mode:'safe-fallback',sources:[],suggestions:[]};}
 const citations=validateCitations(response.sources,options.availableSources,response.locale,5);
 if(!citations.valid)reasons.push(...citations.reasons);
 response.sources=citations.accepted;
 const allow=new Set((options.hostActionIds??[]).slice(0,30));const suggestions=response.suggestions.filter(s=>allow.has(s.id));const discardedSuggestionCount=response.suggestions.length-suggestions.length;response.suggestions=suggestions.slice(0,4);
 if(discardedSuggestionCount)reasons.push('unsupported-action-suggestion-removed');
 if(response.mode==='remote-reviewed'&&!options.remoteConsent){reasons.push('remote-consent-not-present-at-audit');response={...response,text:contractFallback(response.locale,response.intent),mode:'safe-fallback',sources:[],suggestions:[]};}
 const safety=auditResponseSafety(response,{remoteConsent:options.remoteConsent,isDirectControl:['pause','resume','stop'].includes(response.intent)});
 if(!safety.pass){reasons.push(...safety.violations);response={...response,text:contractFallback(response.locale,response.intent),mode:'safe-fallback',sources:[],suggestions:[]};}
 const contract=checkResponseContract(response);if(contract.length){reasons.push(...contract);response={...response,text:contractFallback(response.locale,response.intent),mode:'safe-fallback',sources:[],suggestions:[]};}
 return{response,accepted:reasons.length===0,reasons:[...new Set(reasons)].slice(0,20),discardedSourceCount:candidate.sources.length-response.sources.length,discardedSuggestionCount};
}
