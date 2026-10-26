import type { Intent, Locale } from '../types.ts';
import type { TopicToken } from '../dialogue/topic-memory.ts';
export type SafeSessionSummary={locale:Locale;turnCount:number;topics:Array<{intent:Intent;count:number}>;note:string;containsRawText:false};
export function buildSafeSessionSummary(tokens:readonly TopicToken[],locale:Locale,maxTopics=4):SafeSessionSummary {
  const map=new Map<Intent,number>();for(const t of tokens)map.set(t.intent,(map.get(t.intent)??0)+1);
  const topics=[...map].map(([intent,count])=>({intent,count})).sort((a,b)=>b.count-a.count).slice(0,maxTopics);
  const note:Record<Locale,string>={en:'This summary describes app topics only; it does not infer mental-health status.',fr:'Ce résumé décrit uniquement les thèmes de l’application; il ne déduit aucun état de santé mentale.',es:'Este resumen describe solo temas de la aplicación; no infiere el estado de salud mental.'};
  return {locale,turnCount:tokens.length,topics,note:note[locale],containsRawText:false};
}
export function sessionSummaryIsPrivacySafe(summary:SafeSessionSummary):boolean{return summary.containsRawText===false&&!('messages' in summary)&&!('transcript' in summary);}
