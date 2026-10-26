import type { KnowledgeArticle, Locale } from '../types.ts';
export type FreshnessStatus='current'|'stale'|'invalid-date'|'unreviewed'|'future-date';
export type FreshnessResult={id:string;status:FreshnessStatus;ageDays?:number;shouldServe:boolean;reason:string};
export function assessArticleFreshness(article:KnowledgeArticle,now=Date.now(),maxAgeDays=365):FreshnessResult {
 if(!article.reviewed)return{id:article.id,status:'unreviewed',shouldServe:false,reason:'human-review-required'};
 const updated=Date.parse(article.updatedAt);if(!Number.isFinite(updated))return{id:article.id,status:'invalid-date',shouldServe:false,reason:'updated-at-is-not-a-date'};
 if(updated>now+86_400_000)return{id:article.id,status:'future-date',shouldServe:false,reason:'updated-at-is-in-future'};
 const ageDays=Math.max(0,(now-updated)/86_400_000);if(ageDays>maxAgeDays)return{id:article.id,status:'stale',ageDays,shouldServe:false,reason:'review-age-threshold-exceeded'};
 return{id:article.id,status:'current',ageDays,shouldServe:true,reason:'reviewed-and-current'};
}
export function filterFreshArticles<T extends KnowledgeArticle>(articles:T[],now=Date.now(),maxAgeDays=365):{servable:T[];excluded:FreshnessResult[]}{const servable:T[]=[],excluded:FreshnessResult[]=[];for(const article of articles){const r=assessArticleFreshness(article,now,maxAgeDays);if(r.shouldServe)servable.push(article);else excluded.push(r);}return{servable,excluded};}
export function localeArticleCoverage(articles:KnowledgeArticle[],locale:Locale,now=Date.now(),maxAgeDays=365):{total:number;current:number;coverage:number;missingIds:string[]}{const all=articles.filter(a=>a.locale===locale);const current=all.filter(a=>assessArticleFreshness(a,now,maxAgeDays).shouldServe);return{total:all.length,current:current.length,coverage:all.length?current.length/all.length:0,missingIds:all.filter(a=>!assessArticleFreshness(a,now,maxAgeDays).shouldServe).map(a=>a.id)};}
