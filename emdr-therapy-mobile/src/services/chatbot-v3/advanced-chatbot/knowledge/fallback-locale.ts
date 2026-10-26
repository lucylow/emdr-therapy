import type { KnowledgeArticle, Locale } from '../types.ts';
export type LocaleSelection={article?:KnowledgeArticle;requested:Locale;actual?:Locale;usedFallback:boolean;message?:string};
export function selectArticleLocale(articles:readonly KnowledgeArticle[],id:string,requested:Locale,allowFallback=false):LocaleSelection {
 const exact=articles.find(a=>a.id===id&&a.locale===requested&&a.reviewed);if(exact)return {article:exact,requested,actual:requested,usedFallback:false};
 if(!allowFallback)return {requested,usedFallback:false,message:'no-reviewed-article-in-requested-locale'};
 const alternative=articles.find(a=>a.id===id&&a.reviewed);if(!alternative)return {requested,usedFallback:false,message:'no-reviewed-article'};
 return {article:alternative,requested,actual:alternative.locale,usedFallback:true,message:'show-language-mismatch-before-fallback'};
}
export function shouldAutomaticallyUseAlternateLanguage(selection:LocaleSelection):boolean{return false;}
