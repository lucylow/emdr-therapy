import type { Intent, IntentCandidate, Locale, RiskSignal } from '../types.ts';
export type ConversationGoal={intent:Intent;priority:number;score:number;reason:string;requiresConfirmation:boolean;isControl:boolean};
export type GoalPlan={goals:ConversationGoal[];first:ConversationGoal;needsClarification:boolean;clarificationPrompt?:string;blockProvider:boolean};
const PRIORITY:Partial<Record<Intent,number>>={stop:100,pause:95,resume:90,safety_support:110,privacy:80,app_help:50,session_setup:60,adjust_speed:40,adjust_duration:40,adjust_audio:40,adjust_visual:40,grounding:30,breathing:30,emdr_definition:20,feedback:15,greeting:10,farewell:5,unknown:0,clarify:0};
const CONTROL=new Set<Intent>(['stop','pause','resume','safety_support']);
const QUESTIONS:Record<Locale,string>={en:'Which part would you like to handle first?',fr:'Quelle partie souhaitez-vous traiter en premier ?',es:'¿Qué parte quieres resolver primero?'};
export function planMultipleGoals(candidates:IntentCandidate[],locale:Locale,risk:RiskSignal,diagnosisRequest=false):GoalPlan {
 const goals=candidates.filter(c=>c.intent!=='unknown'&&c.score>=0.3).map(c=>({intent:c.intent,priority:PRIORITY[c.intent]??0,score:c.score,reason:c.evidence.slice(0,3).join(',')||'intent-candidate',requiresConfirmation:['adjust_speed','adjust_duration','adjust_audio','adjust_visual','session_setup'].includes(c.intent),isControl:CONTROL.has(c.intent)})).sort((a,b)=>b.priority-a.priority||b.score-a.score).slice(0,4);
 if(risk!=='none')goals.unshift({intent:'safety_support',priority:110,score:1,reason:'safety-signal-overrides-other-goals',requiresConfirmation:false,isControl:true});
 if(diagnosisRequest)goals.unshift({intent:'unknown',priority:105,score:1,reason:'clinical-boundary-overrides-other-goals',requiresConfirmation:false,isControl:false});
 const unique=goals.filter((g,i,arr)=>arr.findIndex(x=>x.intent===g.intent)===i).slice(0,4);const first=unique[0]??{intent:'unknown' as const,priority:0,score:0,reason:'no-confident-goal',requiresConfirmation:false,isControl:false};
 return{goals:unique,first,needsClarification:unique.length>1&&unique[1]!.priority===first.priority&&Math.abs(unique[1]!.score-first.score)<0.1,clarificationPrompt:unique.length>1?QUESTIONS[locale]:undefined,blockProvider:risk!=='none'||diagnosisRequest||unique.some(g=>g.isControl)};
}
