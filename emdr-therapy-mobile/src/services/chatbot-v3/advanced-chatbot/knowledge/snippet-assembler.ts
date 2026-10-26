import type { KnowledgeArticle, Locale } from '../types.ts';
import { normalizeText, tokenize, redactSensitiveText, hasPromptInjectionSignals } from '../text.ts';
import { assessArticleFreshness } from './freshness.ts';

export type AssembledSnippet = { id:string; title:string; locale:Locale; excerpt:string; relevance:number; tags:string[] };
export type SnippetAssembly = { snippets:AssembledSnippet[]; excluded:Array<{id:string;reason:string}>; usedChars:number; queryWasRedacted:boolean };
export type SnippetOptions = { maxSnippets?:number; maxChars?:number; maxArticleChars?:number; maxAgeDays?:number; intent?:string; now?:number };

const STOPWORDS=new Set(['a','an','and','are','as','at','be','can','do','for','from','how','i','in','is','it','me','my','of','on','or','please','the','this','to','what','when','where','which','with','you','your','de','des','du','est','la','le','les','ma','mes','mon','ou','pour','que','qui','je','et','en','el','la','los','las','de','del','que','como','con','por','para','mi','mis','un','una','y']);
function terms(value:string):Set<string>{return new Set(tokenize(normalizeText(value)).filter(t=>t.length>=2&&!STOPWORDS.has(t)));}
function overlap(query:Set<string>,article:Set<string>):number{if(!query.size||!article.size)return 0;let hits=0;for(const word of query)if(article.has(word))hits++;return hits/query.size;}
function safeExcerpt(article:KnowledgeArticle,max:number):string{
 const combined=`${article.title}. ${article.body}`;
 if(hasPromptInjectionSignals(combined))return '';
 return redactSensitiveText(combined).replace(/<\/?(?:script|system|assistant|user|tool)[^>]*>/gi,'').slice(0,max).trim();
}
/** Builds bounded reviewed-only evidence snippets; retrieved content remains untrusted data, never policy. */
export function assembleKnowledgeSnippets(query:string,articles:KnowledgeArticle[],locale:Locale,options:SnippetOptions={}):SnippetAssembly {
 const now=options.now??Date.now(),maxSnippets=Math.max(0,Math.min(8,options.maxSnippets??4)),maxChars=Math.max(0,Math.min(8000,options.maxChars??3000)),maxArticleChars=Math.max(80,Math.min(1200,options.maxArticleChars??700));
 const safeQuery=redactSensitiveText(query);const queryWasRedacted=safeQuery!==query;const q=terms(safeQuery);const eligible:AssembledSnippet[]=[],excluded:SnippetAssembly['excluded']=[];
 for(const article of articles){
  if(article.locale!==locale){excluded.push({id:article.id,reason:'locale-mismatch'});continue;}
  if(!article.reviewed){excluded.push({id:article.id,reason:'not-reviewed'});continue;}
  const freshness=assessArticleFreshness(article,now,options.maxAgeDays??365);if(!freshness.shouldServe){excluded.push({id:article.id,reason:freshness.reason});continue;}
  const excerpt=safeExcerpt(article,maxArticleChars);if(!excerpt){excluded.push({id:article.id,reason:'unsafe-or-empty-content'});continue;}
  const articleTerms=terms(`${article.title} ${article.body} ${article.tags.join(' ')}`);const score=overlap(q,articleTerms)+(options.intent&&article.intent===options.intent?.valueOf()?0.15:0);
  eligible.push({id:article.id,title:article.title.slice(0,140),locale:article.locale,excerpt,relevance:Math.min(1,Number(score.toFixed(3))),tags:article.tags.slice(0,8).map(t=>t.slice(0,40))});
 }
 eligible.sort((a,b)=>b.relevance-a.relevance||a.id.localeCompare(b.id));const snippets:AssembledSnippet[]=[];let usedChars=0;
 for(const snip of eligible){if(snippets.length>=maxSnippets)break;const estimated=snip.id.length+snip.title.length+snip.excerpt.length+snip.tags.join(',').length;if(usedChars+estimated>maxChars)continue;snippets.push(snip);usedChars+=estimated;}
 return{snippets,excluded,usedChars,queryWasRedacted};
}
export function snippetsToUntrustedEvidence(snippets:AssembledSnippet[]):string {
 return snippets.map(s=>`<reviewed_evidence id="${s.id}" title="${s.title.replace(/[<>]/g,'')}">\n${s.excerpt.replace(/[<>]/g,'')}\n</reviewed_evidence>`).join('\n').slice(0,8000);
}
