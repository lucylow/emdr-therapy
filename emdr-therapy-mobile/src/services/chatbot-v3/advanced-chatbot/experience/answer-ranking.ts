import type { Intent, Locale } from '../types.ts';
import { classifyIntents } from '../intent-engine.ts';
import { retrieveKnowledge } from '../knowledge/retrieval.ts';
export type AnswerCandidate={id:string;intent:Intent;locale:Locale;text:string;score:number;reason:string};
export function rankLocalAnswers(query:string,locale:Locale):AnswerCandidate[] {
 const intents=classifyIntents(query,locale);const top=intents[0]?.intent;const results=retrieveKnowledge(query,{locale,intent:top==='unknown'?undefined:top,minScore:0.08,margin:0,reviewedOnly:true,limit:5});
 return results.hits.map(hit=>({id:hit.article.id,intent:hit.article.intent??'unknown',locale,text:hit.article.body,score:Math.min(1,hit.score+(hit.article.intent===top?0.08:0)),reason:`match:${hit.evidence.slice(0,5).join(',')}`})).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
export function acceptLocalAnswer(candidates:AnswerCandidate[],minScore=0.18,margin=0.03):AnswerCandidate|undefined {
 if(!candidates.length||candidates[0].score<minScore)return undefined;if(candidates[1]&&candidates[0].score-candidates[1].score<margin)return undefined;return candidates[0];
}
