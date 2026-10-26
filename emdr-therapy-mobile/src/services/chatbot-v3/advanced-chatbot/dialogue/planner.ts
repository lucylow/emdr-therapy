import type { Intent, IntentCandidate, Locale } from '../types.ts';
import { isDirectControl } from '../intent-engine.ts';

export type DialoguePlan={primary:IntentCandidate; secondary:IntentCandidate[]; strategy:'control-guidance'|'safety-template'|'diagnostic-boundary'|'retrieval'|'clarification'|'smalltalk'|'remote-fallback'; allowRemote:boolean; useHistory:boolean; reasons:string[]};
export function planDialogue(candidates:IntentCandidate[], flags:{risk:boolean;diagnosisRequest:boolean;promptInjection:boolean;remoteConsented:boolean;historyConsented:boolean;localOnly:boolean},locale:Locale):DialoguePlan {
  const ranked=[...candidates].sort((a,b)=>b.score-a.score);const primary=ranked[0]??{intent:'unknown' as Intent,score:0,evidence:[]};
  const secondary=ranked.slice(1).filter(c=>c.score>=0.45&&c.score>=primary.score*0.72).slice(0,2);const reasons:string[]=[];
  if(flags.risk){reasons.push('safety-signal-overrides-all-other-routes');return {primary,secondary,strategy:'safety-template',allowRemote:false,useHistory:false,reasons};}
  if(flags.diagnosisRequest){reasons.push('medical-diagnosis-boundary');return {primary,secondary,strategy:'diagnostic-boundary',allowRemote:false,useHistory:false,reasons};}
  if(isDirectControl(primary.intent)){reasons.push('deterministic-control-guidance');return {primary,secondary,strategy:'control-guidance',allowRemote:false,useHistory:false,reasons};}
  if(flags.promptInjection){reasons.push('injection-like-text-kept-local');return {primary,secondary,strategy:'clarification',allowRemote:false,useHistory:false,reasons};}
  if(['greeting','farewell'].includes(primary.intent)){reasons.push('smalltalk-template');return {primary,secondary,strategy:'smalltalk',allowRemote:false,useHistory:false,reasons};}
  const confusable=ranked.length>1&&ranked[1].score>=primary.score-0.08&&ranked[1].intent!==primary.intent;
  if(primary.score<0.35||confusable){reasons.push('intent-confidence-insufficient');return {primary:{...primary,intent:'unknown'},secondary,strategy:'clarification',allowRemote:false,useHistory:false,reasons};}
  if(['app_help','emdr_definition','grounding','breathing','privacy','session_setup','adjust_audio','adjust_visual','adjust_speed','adjust_duration','safety_support'].includes(primary.intent)){
    reasons.push(`known-intent:${primary.intent}`);return {primary,secondary,strategy:'retrieval',allowRemote:false,useHistory:false,reasons};
  }
  const allowRemote=!flags.localOnly&&flags.remoteConsented&&primary.score<0.50;
  reasons.push(allowRemote?'remote-fallback-consented':'local-fallback-default');
  return {primary,secondary,strategy:allowRemote?'remote-fallback':'clarification',allowRemote,useHistory:allowRemote&&flags.historyConsented,reasons};
}
