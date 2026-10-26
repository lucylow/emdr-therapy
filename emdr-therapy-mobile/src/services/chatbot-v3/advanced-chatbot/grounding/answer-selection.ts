import type { Intent, KnowledgeArticle, Locale } from '../types.ts';
import { retrieveKnowledge, type RetrievalHit } from '../knowledge/retrieval.ts';
export type AnswerSelection={status:'selected'|'clarify'|'fallback';answer?:string;articleId?:string;confidence:number;reason:string};
export function selectReviewedAnswer(query:string,locale:Locale,intent?:Intent):AnswerSelection {
 const result=retrieveKnowledge(query,{locale,intent,minScore:0.16,margin:0.035,reviewedOnly:true,limit:5});const best=result.hits[0];
 if(result.accepted&&best)return {status:'selected',answer:best.article.body,articleId:best.article.id,confidence:best.score,reason:`reviewed-knowledge-hit:${best.evidence.slice(0,5).join('|')}`};
 if(best&&best.score>0.12)return {status:'clarify',confidence:best.score,reason:'retrieval-score-or-margin-too-low'};
 return {status:'fallback',confidence:best?.score??0,reason:'no-supported-answer'};
}
export function compareAnswerGrounding(answer:string,articles:readonly KnowledgeArticle[]):{overlap:number;grounded:boolean;matchedIds:string[]} {
 const normalize=(s:string)=>new Set(s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)??[]);const terms=normalize(answer);const matched:string[]=[];let best=0;
 for(const article of articles.filter(a=>a.reviewed)){const source=normalize(article.body);let hits=0;for(const word of terms)if(source.has(word))hits++;const ratio=hits/Math.max(1,terms.size);if(ratio>best)best=ratio;if(ratio>=0.45)matched.push(article.id);}
 return {overlap:Number(best.toFixed(3)),grounded:best>=0.45,matchedIds:matched.slice(0,5)};
}
