import type { Intent, KnowledgeArticle, Locale, Source } from '../types.ts';
import { normalizeText, tokenize } from '../text.ts';
import { BUILTIN_ARTICLES } from './articles.ts';
import { validateKnowledgeArticle } from './articles.ts';

export type RetrievalHit = { article: KnowledgeArticle; score: number; evidence: string[] };
export type RetrievalOptions = { locale: Locale; intent?: Intent; minScore?: number; margin?: number; reviewedOnly?: boolean; limit?: number };
const SYNONYMS: Record<string, string[]> = {
  help:['guide','support','how'], settings:['configuration','options','preferences'],
  stop:['halt','end','emergency'], pause:['break','hold'], resume:['continue','restart'],
  grounding:['present','senses','anchor'], breathing:['breath','respiration'], privacy:['data','delete','forget'],
  emdr:['therapy','eye','movement','reprocessing'], volume:['sound','audio'], color:['colour','visual'],
  duración:['tiempo','minutos'], confidentialité:['données','historique'],
};
function expandTerms(tokens: string[]): Set<string> {
  const out = new Set(tokens);
  for (const token of tokens) for (const term of SYNONYMS[token] ?? []) out.add(normalizeText(term));
  return out;
}
function scoreArticle(query: string, tokens: string[], article: KnowledgeArticle, intent?: Intent): RetrievalHit {
  const title = tokenize(article.title); const body = tokenize(article.body); const tags = article.tags.flatMap(t => tokenize(t));
  const qSet = expandTerms(tokens); const docTerms = new Set([...title, ...body, ...tags]);
  let overlap = 0, weighted = 0; const evidence: string[] = [];
  for (const term of qSet) {
    if (!docTerms.has(term)) continue;
    overlap++;
    const weight = title.includes(term) ? 3 : tags.includes(term) ? 2.5 : 1;
    weighted += weight; evidence.push(term);
  }
  const coverage = overlap / Math.max(1, qSet.size);
  const density = weighted / Math.sqrt(Math.max(1, docTerms.size));
  const phraseBonus = normalizeText(article.title).includes(normalizeText(query)) ? 0.25 : 0;
  const intentBonus = intent && article.intent === intent ? 0.20 : 0;
  const reviewedBonus = article.reviewed ? 0.05 : 0;
  const score = Math.min(1, coverage * 0.53 + Math.min(0.32, density * 0.055) + phraseBonus + intentBonus + reviewedBonus);
  return { article, score, evidence:evidence.slice(0, 8) };
}
export function retrieveKnowledge(query: string, options: RetrievalOptions): { hits: RetrievalHit[]; accepted: boolean; margin: number } {
  const tokens = tokenize(query).filter(t => t.length > 1);
  if (!tokens.length) return { hits:[], accepted:false, margin:0 };
  const pool = options.locale ? BUILTIN_ARTICLES.filter(a => a.locale === options.locale) : [...BUILTIN_ARTICLES];
  const hits = pool.filter(a => options.reviewedOnly === false || a.reviewed)
    .filter(a => !options.intent || !a.intent || a.intent === options.intent || options.intent === 'unknown')
    .map(a => scoreArticle(query, tokens, a, options.intent))
    .sort((a,b) => b.score-a.score || a.article.id.localeCompare(b.article.id)).slice(0, options.limit ?? 5);
  const best = hits[0]?.score ?? 0; const second = hits[1]?.score ?? 0;
  const margin = best - second;
  const accepted = best >= (options.minScore ?? 0.16) && (hits.length < 2 || margin >= (options.margin ?? 0.02));
  return { hits, accepted, margin };
}
export function hitToSource(hit: RetrievalHit): Source {
  return { id:hit.article.id, title:hit.article.title, locale:hit.article.locale, snippet:hit.article.body.slice(0, 240), trust:hit.article.reviewed ? 'local-reviewed' : 'remote-unverified' };
}
export function auditKnowledgeBase(articles: readonly KnowledgeArticle[] = BUILTIN_ARTICLES): Array<{ id:string; errors:string[] }> {
  return articles.map(article => ({id:article.id, errors:validateKnowledgeArticle(article)})).filter(row => row.errors.length > 0);
}
