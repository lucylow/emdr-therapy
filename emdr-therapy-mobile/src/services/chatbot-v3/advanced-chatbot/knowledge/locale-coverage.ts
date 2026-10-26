import type { KnowledgeArticle, Locale } from '../types.ts';
export type LocaleCoverage={locale:Locale;articleCount:number;intentCount:number;missingIntents:string[];ready:boolean};
const REQUIRED=['app_help','emdr_definition','grounding','breathing','privacy','safety_support'] as const;
export function knowledgeLocaleCoverage(articles:readonly KnowledgeArticle[]):LocaleCoverage[] {
 return (['en','fr','es'] as const).map(locale=>{const subset=articles.filter(a=>a.locale===locale&&a.reviewed);const intents=new Set(subset.map(a=>a.intent).filter(Boolean) as string[]);const missingIntents=REQUIRED.filter(i=>!intents.has(i));return {locale,articleCount:subset.length,intentCount:intents.size,missingIntents:[...missingIntents],ready:missingIntents.length===0};});
}
