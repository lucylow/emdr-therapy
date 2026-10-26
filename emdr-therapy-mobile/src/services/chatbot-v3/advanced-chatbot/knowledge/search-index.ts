import type { KnowledgeArticle, Locale } from '../types.ts';
import { normalizeText, tokenize } from '../text.ts';
export type SearchDocument={id:string;locale:Locale;terms:string[];length:number;reviewed:boolean;intent?:string;title:string};
export class LocalKnowledgeIndex {
 private readonly documents=new Map<string,SearchDocument>();private readonly termToIds=new Map<string,Set<string>>();
 constructor(articles:readonly KnowledgeArticle[]=[]){this.replaceAll(articles);}
 replaceAll(articles:readonly KnowledgeArticle[]):void {this.clear();for(const article of articles)this.add(article);}
 add(article:KnowledgeArticle):void {
  if(!article.reviewed)return;this.remove(article.id);const terms=[...new Set(tokenize(`${article.title} ${article.tags.join(' ')} ${article.body}`))];
  const document:SearchDocument={id:article.id,locale:article.locale,terms,length:terms.length,reviewed:article.reviewed,intent:article.intent,title:article.title};this.documents.set(article.id,document);
  for(const term of terms){const ids=this.termToIds.get(term)??new Set<string>();ids.add(article.id);this.termToIds.set(term,ids);}
 }
 remove(id:string):boolean {const document=this.documents.get(id);if(!document)return false;for(const term of document.terms){const ids=this.termToIds.get(term);ids?.delete(id);if(!ids?.size)this.termToIds.delete(term);}this.documents.delete(id);return true;}
 search(query:string,locale:Locale,limit=10):Array<{id:string;score:number;title:string;intent?:string}> {
  const terms=[...new Set(tokenize(query))];if(!terms.length)return [];const candidates=new Set<string>();for(const term of terms)for(const id of this.termToIds.get(term)??[])candidates.add(id);
  const scored:Array<{id:string;score:number;title:string;intent?:string}>=[];for(const id of candidates){const doc=this.documents.get(id)!;if(doc.locale!==locale||!doc.reviewed)continue;let overlap=0;for(const term of terms)if(doc.terms.includes(term))overlap++;const score=overlap/Math.sqrt(Math.max(1,doc.length));if(score>0)scored.push({id,score,title:doc.title,intent:doc.intent});}
  return scored.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.min(30,limit)));
 }
 clear():void{this.documents.clear();this.termToIds.clear();}
 get size():number{return this.documents.size;}
 get termCount():number{return this.termToIds.size;}
}
