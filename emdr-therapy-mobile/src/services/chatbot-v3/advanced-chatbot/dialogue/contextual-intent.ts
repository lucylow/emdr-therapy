import type { DialogueSnapshot, Intent, Locale } from '../types.ts';
import { resolveFollowUp } from './followup.ts';
import { classifyPrimaryIntent } from '../intent-engine.ts';
export type ContextualIntent={intent:Intent;confidence:number;usedContext:boolean;reason:string};
export function resolveContextualIntent(text:string,snapshot:DialogueSnapshot,locale:Locale):ContextualIntent {
 const current=classifyPrimaryIntent(text,locale);
 const follow=resolveFollowUp(text,snapshot,locale);
 // Resolve short follow-up phrases against ephemeral context before generic lexical matches.
 if(follow.intent&&follow.kind!=='none')return {intent:follow.intent,confidence:0.62,usedContext:true,reason:`follow-up:${follow.kind}`};
 if(current.score>=0.75&&current.intent!=='unknown')return {intent:current.intent,confidence:current.score,usedContext:false,reason:'explicit-current-turn'};
 if(follow.kind==='repeat'&&snapshot.lastIntent)return {intent:snapshot.lastIntent,confidence:0.58,usedContext:true,reason:'repeat-last-topic'};
 return {intent:current.intent,confidence:current.score,usedContext:false,reason:'no-contextual-match'};
}
export function shouldUseContextualRoute(text:string,locale:Locale):boolean {
 const s=text.trim().toLocaleLowerCase(locale);return s.length<40&&/^(it|that|those|more|less|slower|faster|again|repeat|yes|no|oui|non|sí|no|plus|menos|otra vez)\b/u.test(s);
}
