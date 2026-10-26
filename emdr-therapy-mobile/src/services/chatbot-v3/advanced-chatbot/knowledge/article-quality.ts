import type { KnowledgeArticle } from '../types.ts';
import { validateKnowledgeArticle } from './articles.ts';
export type KnowledgeAuditRow={id:string;errors:string[];warnings:string[]};
const CLAIMS=[/\b(cure|guaranteed to heal|permanently fixes|proven to eliminate)\b/iu,/\b(you are safe|you cannot be harmed)\b/iu,/\b(diagnose|diagnosis)\b/iu];
export function auditArticle(article:KnowledgeArticle):KnowledgeAuditRow {
  const errors=validateKnowledgeArticle(article);const warnings:string[]=[];
  if(CLAIMS.some(p=>p.test(article.body)))warnings.push('review-clinical-claim');
  if(/https?:\/\//i.test(article.body))warnings.push('review-external-link');
  if(article.body.split(/\s+/).length>500)warnings.push('long-article');
  if(!article.caution&&article.intent&&['emdr_definition','grounding','breathing','safety_support'].includes(article.intent))warnings.push('consider-caution-note');
  return {id:article.id,errors,warnings};
}
export function articleSetHasDuplicateIds(articles:KnowledgeArticle[]):string[]{const seen=new Set<string>();const duplicates:string[]=[];for(const a of articles){if(seen.has(a.id))duplicates.push(a.id);seen.add(a.id);}return duplicates;}
