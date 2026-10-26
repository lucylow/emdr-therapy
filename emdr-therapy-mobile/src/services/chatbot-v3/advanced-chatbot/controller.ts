import type { ChatResponse, ChatModelProvider, Intent, Locale, TurnInput, UserPreferences } from './types.ts';
import { DEFAULT_ADVANCED_CONFIG, validateConfig, sanitizePreferences, type AdvancedChatbotConfig } from './config.ts';
import { clampText, detectLocale, hasPromptInjectionSignals, redactSensitiveText } from './text.ts';
import { classifyIntents, classifyPrimaryIntent } from './intent-engine.ts';
import { detectSafetySignal, safetyResponse, containsMedicalDiagnosisRequest, medicalBoundary } from './policy/safety.ts';
import { suggestionsForIntent } from './policy/action-policy.ts';
import { templateFor } from './locales/templates.ts';
import { retrieveKnowledge, hitToSource } from './knowledge/retrieval.ts';
import { DialogueSessionStore } from './dialogue/session-store.ts';
import { normalizeTurn } from './dialogue/rate-limited-turn.ts';
import { planDialogue } from './dialogue/planner.ts';
import { ModelRouter } from './provider/model-router.ts';
import { buildModelRequest } from './provider/prompt-builder.ts';
import { PerConversationLimiter } from './provider/rate-limiter.ts';
import { applyTone } from './personalization/tone.ts';
import { detectClinicalBoundary, clinicalBoundaryReply } from './policy/clinical-boundary.ts';
import { gateRemoteResponse } from './policy/remote-response-gate.ts';
import { enforceRemoteRequestPolicy } from './privacy/request-policy.ts';
import type { IntentCandidate, RiskSignal, Source, TurnConsent } from './types.ts';

export type AdvancedChatbotOptions={config?:Partial<AdvancedChatbotConfig>;provider?:ChatModelProvider;remoteProviderEnabled?:boolean};
export class AdvancedChatbot {
  readonly config:AdvancedChatbotConfig;
  readonly sessions:DialogueSessionStore;
  private readonly router:ModelRouter;
  private readonly limiter:PerConversationLimiter;
  private sequence=0;
  constructor(options:AdvancedChatbotOptions={}) {
    this.config=validateConfig(options.config??{});this.sessions=new DialogueSessionStore(this.config);
    this.router=new ModelRouter(options.provider, this.config.remoteEnabled&&options.remoteProviderEnabled===true, this.config.requestTimeoutMs);
    this.limiter=new PerConversationLimiter(this.config.maxRequestsPerMinute,60_000,1000);
  }
  async respond(input:TurnInput):Promise<ChatResponse> {
    const suppliedPrefs=sanitizePreferences(input.preferences);
    const turn=normalizeTurn(input,this.config.maxInputChars,{remoteProcessing:this.config.remoteEnabled,sendHistory:true,storeTranscript:this.config.storeRawTranscripts});
    const initialSnapshot=this.sessions.get(turn.conversationId,turn.now);
    const effectivePreferences:UserPreferences={...initialSnapshot.preference,...suppliedPrefs};
    if(Object.keys(suppliedPrefs).length)this.sessions.setPreferences(turn.conversationId,effectivePreferences,turn.now);
    const requestedLocale=(input.locale&&['en','fr','es'].includes(input.locale)?input.locale:undefined)??effectivePreferences.locale??this.config.defaultLocale;
    const turnId=`t${(++this.sequence).toString(36)}-${turn.now.toString(36)}`;
    const limited=this.limiter.consume(turn.conversationId,turn.now);
    if(!limited.allowed)return this.makeResponse({preferences:effectivePreferences,text:this.limitedMessage(requestedLocale),locale:requestedLocale,intent:'unknown',confidence:1,safetySignal:'none',turnId,mode:'safe-fallback',explanation:['local-rate-limit']});
    if(!turn.text)return this.makeResponse({preferences:effectivePreferences,text:templateFor('clarify',requestedLocale),locale:requestedLocale,intent:'clarify',confidence:1,safetySignal:'none',turnId,mode:'local-template',explanation:['empty-input']});
    const snapshot=this.sessions.get(turn.conversationId,turn.now);
    const locale=(input.locale&&['en','fr','es'].includes(input.locale)?input.locale:effectivePreferences.locale)??detectLocale(turn.text,this.config.defaultLocale);
    const primary=classifyPrimaryIntent(turn.text,locale);
    const candidates=classifyIntents(turn.text,locale);
    const risk=detectSafetySignal(turn.text,locale);
    const injection=hasPromptInjectionSignals(turn.text);
    const diagnosis=containsMedicalDiagnosisRequest(turn.text);
    const clinicalBoundary=detectClinicalBoundary(turn.text,locale);
    const consent:TurnConsent=turn.consent;
    // Safety, clinical-boundary, and direct-control paths are deterministic and never call the provider.
    if(risk!=='none') {
      this.recordTurn(turn.conversationId,primary.intent,turn.now);
      return this.makeResponse({preferences:effectivePreferences,text:safetyResponse(risk,locale)!,locale,intent:'safety_support',confidence:0.99,safetySignal:risk,turnId,mode:'local-template',explanation:['deterministic-support-routing','no-provider-call']});
    }
    if(diagnosis||clinicalBoundary==='diagnosis') return this.makeResponse({preferences:effectivePreferences,text:medicalBoundary(locale),locale,intent:'unknown',confidence:0.99,safetySignal:'none',turnId,mode:'local-template',explanation:['diagnosis-boundary','no-provider-call']});
    if(clinicalBoundary!=='none') return this.makeResponse({preferences:effectivePreferences,text:clinicalBoundaryReply(clinicalBoundary,locale),locale,intent:'unknown',confidence:0.99,safetySignal:'none',turnId,mode:'local-template',explanation:[`clinical-boundary:${clinicalBoundary}`,'no-provider-call']});
    if(['pause','resume','stop'].includes(primary.intent)) {
      this.recordTurn(turn.conversationId,primary.intent,turn.now);
      return this.makeResponse({preferences:effectivePreferences,text:templateFor(primary.intent,locale),locale,intent:primary.intent,confidence:primary.score,safetySignal:'none',turnId,mode:'local-template',suggestions:suggestionsForIntent(primary.intent),explanation:['direct-control-guidance','host-control-remains-authoritative','no-provider-call']});
    }
    const plan=planDialogue(candidates,{risk:false,diagnosisRequest:false,promptInjection:injection,remoteConsented:consent.remoteProcessing,historyConsented:consent.sendHistory,localOnly:turn.localOnly},locale);
    const intent=plan.primary.intent;
    this.recordTurn(turn.conversationId,intent,turn.now);
    if(injection)return this.makeResponse({preferences:effectivePreferences,text:templateFor('unknown',locale),locale,intent:'unknown',confidence:0.2,safetySignal:'none',turnId,mode:'safe-fallback',explanation:['injection-signal-detected','provider-blocked']});
    if(['greeting','farewell','feedback'].includes(intent))return this.makeResponse({preferences:effectivePreferences,text:templateFor(intent,locale),locale,intent,confidence:primary.score,safetySignal:'none',turnId,mode:'local-template',explanation:plan.reasons});
    const retrievalIntent=intent==='unknown'?undefined:intent;
    const found=retrieveKnowledge(turn.text,{locale,intent:retrievalIntent,minScore:this.config.minimumRetrievalScore,margin:this.config.retrievalScoreMargin,reviewedOnly:this.config.requireReviewedKnowledge,limit:5});
    if(found.accepted&&found.hits[0]) {
      const hit=found.hits[0];const text=hit.article.body;
      return this.makeResponse({preferences:effectivePreferences,text,locale,intent:hit.article.intent??intent,confidence:Math.max(primary.score,hit.score),sources:[hitToSource(hit)],safetySignal:'none',turnId,mode:'local-retrieval',explanation:[`reviewed-article:${hit.article.id}`,`retrieval-score:${hit.score.toFixed(3)}`,`retrieval-margin:${found.margin.toFixed(3)}`,`evidence:${hit.evidence.join(',')}`],suggestions:suggestionsForIntent(hit.article.intent??intent)});
    }
    // Remote is an explicit product opt-in plus per-turn consent. History is never supplied by this layer.
    const canTryRemote=this.config.remoteEnabled&&consent.remoteProcessing&&!turn.localOnly&&intent==='unknown'&&primary.score<0.35;
    if(canTryRemote) {
      const request=buildModelRequest({locale,userText:turn.text,context:[],includeContext:false,maxOutputTokens:300});
      const audit=enforceRemoteRequestPolicy({request,remoteConsent:consent.remoteProcessing,providerEnabled:this.config.remoteEnabled,sendHistoryConsent:consent.sendHistory,allowContext:false});
      if(audit.allowed&&audit.request) {
        const outcome=await this.router.generate(audit.request,{remoteProcessing:true,sendHistory:false,storeTranscript:false},turn.now);
        if(outcome.ok&&outcome.result) {
          const reviewed=gateRemoteResponse({text:outcome.result.text,locale,providerEnabled:this.config.remoteEnabled,userConsent:consent.remoteProcessing,maxChars:this.config.maxOutputChars});
          if(reviewed.accepted)return this.makeResponse({preferences:effectivePreferences,text:reviewed.text,locale,intent:'unknown',confidence:0.35,safetySignal:'none',turnId,mode:'remote-reviewed',sources:reviewed.sources,explanation:['consented-remote-fallback','outbound-data-redacted',...reviewed.reasons]});
        }
      }
    }
    const fallbackIntent:Intent=intent==='unknown'?'unknown':intent;
    const suggestions=suggestionsForIntent(fallbackIntent);
    return this.makeResponse({preferences:effectivePreferences,text:templateFor(fallbackIntent,locale),locale,intent:fallbackIntent,confidence:primary.score,safetySignal:'none',turnId,mode:found.hits.length?'safe-fallback':'local-template',suggestions,explanation:[...plan.reasons,found.hits.length?'retrieval-not-confident':'no-knowledge-match']});
  }
  clearConversation(id:string):void {this.sessions.clear(id);this.limiter.clear(id);}
  clearAll():void {this.sessions.clearAll();this.limiter.clearAll();this.sequence=0;}
  private recordTurn(id:string,intent:Intent,now:number):void {this.sessions.update(id,s=>({...s,turnCount:s.turnCount+1,lastIntent:intent}),now);}
  private makeResponse(input:{preferences?:UserPreferences;text:string;locale:Locale;intent:Intent;confidence:number;safetySignal:RiskSignal;turnId:string;mode:ChatResponse['mode'];sources?:Source[];suggestions?:ChatResponse['suggestions'];explanation:string[]}):ChatResponse {
    const response:ChatResponse={text:clampText(input.text,this.config.maxOutputChars),locale:input.locale,intent:input.intent,confidence:Math.max(0,Math.min(1,input.confidence)),sources:input.sources??[],suggestions:input.suggestions??[],safetySignal:input.safetySignal,mode:input.mode,explanation:input.explanation.slice(0,12),turnId:input.turnId};
    response.text=applyTone(response.text,input.preferences,input.locale);
    return response;
  }
  private limitedMessage(locale:Locale):string{return ({en:'Please pause for a moment before sending another message.',fr:'Veuillez patienter un instant avant d’envoyer un autre message.',es:'Espera un momento antes de enviar otro mensaje.'})[locale]}
}
export function createAdvancedChatbot(options:AdvancedChatbotOptions={}):AdvancedChatbot{return new AdvancedChatbot(options)}
