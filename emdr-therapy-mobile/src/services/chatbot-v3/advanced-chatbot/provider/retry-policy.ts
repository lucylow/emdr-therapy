export type RetryDecision={retry:boolean;delayMs:number;reason:'transient-network'|'timeout'|'provider-busy'|'policy-block'|'invalid-output'|'unknown-error'|'attempt-limit'};
export function decideRetry(errorCode:string,attempt:number,maxAttempts=2):RetryDecision {
 if(attempt>=maxAttempts)return {retry:false,delayMs:0,reason:'attempt-limit'};
 if(/consent|policy|injection|unsafe|blocked/i.test(errorCode))return {retry:false,delayMs:0,reason:'policy-block'};
 if(/invalid-output|malformed|empty-content/i.test(errorCode))return {retry:false,delayMs:0,reason:'invalid-output'};
 if(/timeout|abort/i.test(errorCode))return {retry:attempt===0,delayMs:attempt===0?200:0,reason:'timeout'};
 if(/network|fetch|connection/i.test(errorCode))return {retry:attempt===0,delayMs:attempt===0?300:0,reason:'transient-network'};
 if(/429|503|busy|rate.limit/i.test(errorCode))return {retry:attempt===0,delayMs:attempt===0?800:0,reason:'provider-busy'};
 return {retry:false,delayMs:0,reason:'unknown-error'};
}
export function retryIsSafe(decision:RetryDecision,requestHasUserSideEffect:boolean):boolean{return decision.retry&&!requestHasUserSideEffect;}
