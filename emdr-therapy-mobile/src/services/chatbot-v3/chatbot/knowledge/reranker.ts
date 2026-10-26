import { normalizeForMatching } from '../../text/normalize-base.ts';
import { tokenize } from '../../text/tokenize.ts';
import type { Language } from '../../types.ts';
import type { KnowledgeArticle, KnowledgeMatch, LocalKnowledgeRetriever } from './retriever.ts';
import { normalizeKnowledgeQuery } from './query-normalization.ts';

export interface RerankExplanation { articleId: string; originalScore: number; rerankedScore: number; titleOverlap: number; questionOverlap: number; tagOverlap: number; exactQuestion: boolean; }
export interface RerankResult { matches: KnowledgeMatch[]; explanations: RerankExplanation[]; }

/** Adds explainable field-aware ranking to first-pass retrieval. Scores are ranking aids, not probabilities. */
export function rerankKnowledgeMatches(query: string, matches: KnowledgeMatch[], retriever: LocalKnowledgeRetriever, language: Language = 'unknown', maxResults = 5): RerankResult {
  const locale = language === 'fr' || language === 'es' ? language : 'en';
  const normalized = normalizeForMatching(query);
  const queryTerms = new Set(normalizeKnowledgeQuery(query, language).originalTerms.filter((term) => term.length > 1));
  const scored = matches.map((match, index) => {
    const article = retriever.getArticle(match.articleId);
    if (!article) return { match, score: match.score, explanation: { articleId: match.articleId, originalScore: match.score, rerankedScore: match.score, titleOverlap: 0, questionOverlap: 0, tagOverlap: 0, exactQuestion: false }, index };
    const titleTerms = terms(article.title);
    const questionTerms = new Set(article.questions.flatMap((question) => [...terms(question)]));
    const tagTerms = new Set(article.tags.flatMap((tag) => [...terms(tag)]));
    const titleOverlap = ratio(queryTerms, titleTerms);
    const questionOverlap = ratio(queryTerms, questionTerms);
    const tagOverlap = ratio(queryTerms, tagTerms);
    const exactQuestion = article.questions.some((question) => normalizeForMatching(question) === normalized);
    // The base score stays dominant. Field matches only refine the order slightly.
    const score = Math.max(0, Math.min(0.99, match.score * 0.78 + titleOverlap * 0.10 + questionOverlap * 0.08 + tagOverlap * 0.04 + (exactQuestion ? 0.16 : 0)));
    return { match, score, explanation: { articleId: match.articleId, originalScore: match.score, rerankedScore: Number(score.toFixed(3)), titleOverlap, questionOverlap, tagOverlap, exactQuestion }, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
  const limit = Math.max(1, Math.min(10, Math.floor(maxResults)));
  const selected = scored.slice(0, limit);
  const matchesOut = selected.map((item, index) => ({ ...item.match, score: Number(item.score.toFixed(3)), margin: Number(Math.max(0, item.score - (selected[index + 1]?.score ?? 0)).toFixed(3)) }));
  return { matches: matchesOut, explanations: selected.map((item) => item.explanation) };
}
function terms(value: string): Set<string> { return new Set(tokenize(normalizeForMatching(value)).filter((token) => token.length > 1)); }
function ratio(query: Set<string>, field: Set<string>): number { if (!query.size || !field.size) return 0; let hit = 0; for (const term of query) if (field.has(term)) hit++; return Number((hit / query.size).toFixed(3)); }
