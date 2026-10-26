import type { Intent, Locale, UserPreferences } from '../types.ts';
import type { QuickReply } from './quick-replies.ts';
export function rankQuickReplies(replies:QuickReply[],recentIntents:readonly Intent[],prefs:UserPreferences,locale:Locale):QuickReply[] {
  const counts=new Map<Intent,number>();for(const i of recentIntents)counts.set(i,(counts.get(i)??0)+1);
  const scores=(r:QuickReply)=>{let score=0;if(prefs.confirmedFeatures?.includes(r.id))score+=0.2;if(r.intent===recentIntents.at(-1))score-=0.5;score-=Math.min(0.4,(counts.get(r.intent)??0)*0.08);if(r.intent==='privacy')score+=0.05;return score;};
  return [...replies].sort((a,b)=>scores(b)-scores(a)||a.id.localeCompare(b.id)).slice(0,5).map(r=>({...r}));
}
