import type { Intent, Locale } from '../types.ts';
export type GoalStep={id:string;intent:Intent;required:boolean;status:'pending'|'offered'|'completed'|'skipped';};
export type GoalPlan={id:string;locale:Locale;steps:GoalStep[];createdAt:number;expiresAt:number;status:'active'|'completed'|'cancelled'};
const ALLOWED:Intent[]=['app_help','emdr_definition','grounding','breathing','privacy','adjust_audio','adjust_visual','adjust_speed','adjust_duration'];
export function createGoalPlan(intents:Intent[],locale:Locale,now=Date.now()):GoalPlan {
 const unique=[...new Set(intents.filter(i=>ALLOWED.includes(i)))].slice(0,4);const steps=unique.map((intent,i)=>({id:`step-${i+1}-${intent}`,intent,required:false,status:'pending' as const}));
 return {id:makeId(),locale,steps,createdAt:now,expiresAt:now+10*60_000,status:steps.length?'active':'completed'};
}
export function updateGoalStep(plan:GoalPlan,stepId:string,status:GoalStep['status'],now=Date.now()):GoalPlan {
 if(plan.status!=='active'||now>plan.expiresAt)return {...plan,status:plan.status==='active'?'cancelled':plan.status};
 const exists=plan.steps.some(s=>s.id===stepId);if(!exists)throw new Error('Unknown goal step');
 const steps=plan.steps.map(s=>s.id===stepId?{...s,status}:s);const done=steps.every(s=>s.status==='completed'||s.status==='skipped');return {...plan,steps,status:done?'completed':'active'};
}
export function cancelGoalPlan(plan:GoalPlan):GoalPlan{return {...plan,status:'cancelled',steps:plan.steps.map(s=>({...s,status:s.status==='pending'?'skipped':s.status}))};}
function makeId():string{return Math.random().toString(36).slice(2,10);}
