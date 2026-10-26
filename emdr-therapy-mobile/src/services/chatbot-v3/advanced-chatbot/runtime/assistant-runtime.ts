import type { ChatResponse, TurnInput } from '../types.ts';
import { AdvancedChatbot, type AdvancedChatbotOptions } from '../controller.ts';
import { parseLocalCommand } from '../tools/command-parser.ts';
import { lintGeneratedClaim } from '../policy/claim-linter.ts';
import { structureResponse } from '../experience/response-blocks.ts';
import { checkResponseContract, contractFallback } from '../experience/response-contract.ts';
import { ResponseRepetitionGuard } from '../generation/repetition-guard.ts';
import { validateSuggestedAction, type HostActionId, type HostCapabilities } from '../actions/action-contract.ts';
import { PrivacyMetrics } from '../analytics/privacy-metrics.ts';
import type { StructuredChatResponse } from '../experience/response-blocks.ts';
export type RuntimeResult={response:ChatResponse;view:StructuredChatResponse;localCommand?:'pause'|'resume'|'stop'|'help'|'privacy'|'cancel';hostActionProposal?:HostActionId;contractIssues:string[];claimIssues:string[];filteredSuggestionCount:number};
export type RuntimeOptions=AdvancedChatbotOptions&{hostCapabilities?:HostCapabilities;maxRecentResponses?:number;enableAggregateMetrics?:boolean};
/** Thin integration façade. It never runs proposed host actions; the app handles user-facing confirmation and dispatch. */
export class AssistantRuntime {
 readonly chatbot:AdvancedChatbot;readonly metrics?:PrivacyMetrics;
 private guards=new Map<string,ResponseRepetitionGuard>();private readonly capabilities:HostCapabilities;private readonly guardCap:number;
 constructor(options:RuntimeOptions={}){this.chatbot=new AdvancedChatbot(options);this.capabilities=options.hostCapabilities??{};this.guardCap=Math.max(1,Math.min(100,options.maxRecentResponses??50));if(options.enableAggregateMetrics)this.metrics=new PrivacyMetrics({minCohort:5,maxBuckets:120});}
 async respond(input:TurnInput):Promise<RuntimeResult>{
  const locale=input.locale??input.preferences?.locale??this.chatbot.config.defaultLocale;
  const command=parseLocalCommand(input.text,locale);
  let response=await this.chatbot.respond(input);
  const claim=lintGeneratedClaim(response.text,response.locale);
  const claimIssues=claim.issues;
  if(!claim.safe)response={...response,text:claim.cleanText,mode:'safe-fallback',sources:[],suggestions:[],explanation:[...response.explanation,'claim-linter-replaced-output']};
  const repetitionProtected=['pause','resume','stop','safety_support'].includes(response.intent);
  if(!repetitionProtected){const guard=this.guardFor(input.conversationId);const prior=guard.check(response.text,input.now);if(prior.repeat){const text=contractFallback(response.locale,response.intent);response={...response,text,mode:'safe-fallback',sources:[],suggestions:[],explanation:[...response.explanation,'repetition-guard']};}guard.add(response.turnId,response.text,input.now);}
  const contractIssues=checkResponseContract(response);
  if(contractIssues.length){response={...response,text:contractFallback(response.locale,response.intent),mode:'safe-fallback',sources:[],suggestions:[],explanation:[...response.explanation,'response-contract-fallback',...contractIssues]};}
  const originalSuggestions=response.suggestions;const suggestions=originalSuggestions.filter(a=>validateSuggestedAction(a,this.capabilities).ok);
  response={...response,suggestions};const filteredSuggestionCount=originalSuggestions.length-suggestions.length;
  const view=structureResponse(response);
  this.metrics?.increment(response.mode==='remote-reviewed'?'remote-answer':response.mode==='safe-fallback'?'fallback':response.mode==='local-retrieval'?'local-answer':'turn',month(input.now??Date.now()));
  const hostActionProposal=command.recognized&&['pause','resume','stop'].includes(command.command??'')?command.command as HostActionId:undefined;
  return{response,view,localCommand:command.command,hostActionProposal,contractIssues,claimIssues,filteredSuggestionCount};
 }
 clearConversation(id:string):void{this.chatbot.clearConversation(id);this.guards.get(id)?.clear();this.guards.delete(id);}
 clearAll():void{this.chatbot.clearAll();for(const g of this.guards.values())g.clear();this.guards.clear();this.metrics?.clear();}
 activeGuardCount():number{return this.guards.size;}
 private guardFor(id:string):ResponseRepetitionGuard{let g=this.guards.get(id);if(!g){g=new ResponseRepetitionGuard({capacity:8,ttlMs:30*60_000,threshold:0.92});this.guards.set(id,g);while(this.guards.size>this.guardCap){const first=this.guards.keys().next().value as string|undefined;if(first===undefined)break;this.guards.get(first)?.clear();this.guards.delete(first);}}return g;}
}
function month(now:number):string{const d=new Date(now);return`${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;}
export function createAssistantRuntime(options:RuntimeOptions={}):AssistantRuntime{return new AssistantRuntime(options);}
