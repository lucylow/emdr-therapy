import type { ModelRequest } from '../types.ts';
export type BudgetProfile={maxEstimatedTokens:number;systemReserve:number;responseReserve:number;contextReserve:number};
export type BudgetResult={ok:boolean;request?:ModelRequest;estimatedTokens:number;removedContextMessages:number;reasons:string[]};
export function estimateTokens(text:string):number {let count=0;for(const piece of text.match(/\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu)??[])count+=/^\s+$/.test(piece)?Math.max(1,Math.ceil(piece.length/4)): /^[\p{L}\p{N}_]+$/u.test(piece)?Math.max(1,Math.ceil(piece.length/4)):1;return count;}
export function requestTokenEstimate(request:ModelRequest):number{return estimateTokens(request.system)+estimateTokens(request.user)+request.context.reduce((n,m)=>n+estimateTokens(m.content)+4,0)+Math.max(32,request.maxOutputTokens);}
/** Preserves system policy and current user request; removes oldest context first, never truncates safety policy. */
export function fitRequestToTokenBudget(request:ModelRequest,profile:BudgetProfile):BudgetResult {
 const reasons:string[]=[];const cloned:ModelRequest={...request,context:request.context.map(m=>({...m}))};const responseReserve=Math.max(32,Math.min(1500,profile.responseReserve));
 if(estimateTokens(cloned.system)+estimateTokens(cloned.user)+responseReserve>profile.maxEstimatedTokens){return{ok:false,estimatedTokens:requestTokenEstimate(cloned),removedContextMessages:0,reasons:['system-and-current-user-exceed-budget']};}
 let removed=0;const max=profile.maxEstimatedTokens;
 while(requestTokenEstimate({...cloned,maxOutputTokens:responseReserve})>max&&cloned.context.length){cloned.context.shift();removed++;}
 if(requestTokenEstimate({...cloned,maxOutputTokens:responseReserve})>max){reasons.push('request-remains-over-budget');return{ok:false,estimatedTokens:requestTokenEstimate(cloned),removedContextMessages:removed,reasons};}
 cloned.maxOutputTokens=responseReserve;if(removed)reasons.push('oldest-context-removed');return{ok:true,request:cloned,estimatedTokens:requestTokenEstimate(cloned),removedContextMessages:removed,reasons};
}
export function validateBudgetProfile(profile:BudgetProfile):boolean{return[profile.maxEstimatedTokens,profile.systemReserve,profile.responseReserve,profile.contextReserve].every(n=>Number.isInteger(n)&&n>=0&&n<=100_000)&&profile.maxEstimatedTokens>=profile.systemReserve+profile.responseReserve;}
