import type { KnowledgeArticle, Locale, Source } from '../types.ts';
export type CitationDecision = { accepted: Source[]; rejectedIds: string[]; reason: 'all-reviewed' | 'unknown-or-unreviewed-source' | 'too-many-sources' };

/** Converts model-suggested source IDs into citations backed by reviewed local knowledge only. */
export class ReviewedCitationAllowlist {
  private readonly articleById = new Map<string, KnowledgeArticle>();
  constructor(articles: readonly KnowledgeArticle[], private readonly maxCitations = 4) {
    for (const article of articles) if (article.reviewed && /^[a-z0-9][a-z0-9._-]{1,100}$/i.test(article.id) && isLocale(article.locale)) this.articleById.set(article.id, article);
  }
  resolve(candidateIds: readonly unknown[], locale: Locale): CitationDecision {
    const accepted: Source[] = [], rejectedIds: string[] = []; const seen = new Set<string>();
    if (candidateIds.length > this.maxCitations) return { accepted: [], rejectedIds: candidateIds.map(safeId), reason: 'too-many-sources' };
    for (const id of candidateIds) {
      if (typeof id !== 'string' || id.length > 120 || seen.has(id)) { rejectedIds.push(safeId(id)); continue; }
      seen.add(id);
      const article = this.articleById.get(id);
      if (!article || article.locale !== locale) { rejectedIds.push(id); continue; }
      accepted.push({ id: article.id, title: article.title.slice(0, 180), locale: article.locale, snippet: article.body.slice(0, 240), trust: 'local-reviewed' });
    }
    return { accepted, rejectedIds, reason: rejectedIds.length ? 'unknown-or-unreviewed-source' : 'all-reviewed' };
  }
  hasReviewed(id: string, locale?: Locale): boolean { const article = this.articleById.get(id); return Boolean(article && (!locale || article.locale === locale)); }
  ids(locale?: Locale): string[] { return [...this.articleById.values()].filter(a => !locale || a.locale === locale).map(a => a.id).sort(); }
}
function safeId(value: unknown): string { return typeof value === 'string' ? value.replace(/[^a-z0-9._-]/gi,'').slice(0,80) : '[invalid-id]'; }
function isLocale(value: string): value is Locale { return value === 'en' || value === 'fr' || value === 'es'; }
