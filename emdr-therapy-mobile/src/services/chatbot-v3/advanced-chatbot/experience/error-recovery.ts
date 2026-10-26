import type { Locale } from '../types.ts';
import { fallbackMessage, mapProviderError, type FallbackReason } from '../provider/fallback.ts';
export type RecoveryPlan={message:string;retryAllowed:boolean;retryDelayMs:number;route:'local-faq'|'local-template'|'no-retry';reason:FallbackReason};
export function planRecovery(errorCode:string,locale:Locale,attempt:number,now=Date.now()):RecoveryPlan {
 const reason=mapProviderError(errorCode);let route:RecoveryPlan['route']='local-template';let retryAllowed=false;let delay=0;
 if(reason==='timeout'||reason==='network'){route='local-faq';retryAllowed=attempt===0;delay=retryAllowed?250:0;}
 if(reason==='rate-limit'){route='local-template';retryAllowed=attempt===0;delay=retryAllowed?1000:0;}
 if(reason==='blocked'||reason==='invalid-output'){route='no-retry';retryAllowed=false;}
 void now;return {message:fallbackMessage(reason,locale),retryAllowed,retryDelayMs:delay,route,reason};
}
export function recoveryMustNotRepeatUnsafeRequest(plan:RecoveryPlan):boolean{return plan.route==='no-retry'&&!plan.retryAllowed;}
