import { guardGeneratedResponse } from '../generation/output-guard.ts';
import type { KnowledgeArticle } from './retriever.ts';

export interface KnowledgeAuditIssue { articleId: string; code: string; detail: string; }
export interface KnowledgeAuditReport { totalArticles: number; issues: KnowledgeAuditIssue[]; valid: boolean; }

/** Static knowledge-base linter. Human review is still required before adding clinical or privacy content. */
export function auditKnowledgeBase(articles: readonly KnowledgeArticle[]): KnowledgeAuditReport {
  const issues: KnowledgeAuditIssue[] = [];
  const ids = new Set<string>();
  for (const article of articles) {
    const id = String(article.id ?? '');
    if (!id || !/^[a-z0-9][a-z0-9-]{1,80}$/u.test(id)) issues.push({ articleId: id || '(missing)', code: 'invalid_id', detail: 'Article ID must be a short lowercase slug.' });
    if (ids.has(id)) issues.push({ articleId: id, code: 'duplicate_id', detail: 'Article IDs must be unique.' });
    ids.add(id);
    if (!['en', 'fr', 'es'].includes(article.language)) issues.push({ articleId: id, code: 'unsupported_language', detail: 'Only reviewed language packs are allowed.' });
    if (!article.title.trim()) issues.push({ articleId: id, code: 'empty_title', detail: 'Article title is empty.' });
    if (!article.answer.trim()) issues.push({ articleId: id, code: 'empty_answer', detail: 'Article answer is empty.' });
    if (article.answer.length > 8000) issues.push({ articleId: id, code: 'answer_too_long', detail: 'Article answer exceeds the authoring limit.' });
    if (!article.questions.length) issues.push({ articleId: id, code: 'no_questions', detail: 'Add at least one user-style retrieval question.' });
    if (!article.intents.length) issues.push({ articleId: id, code: 'no_intent', detail: 'Every article must be scoped to one or more routes.' });
    if (!['general_information', 'app_navigation', 'privacy_boundary', 'safety_boundary'].includes(article.scope)) issues.push({ articleId: id, code: 'invalid_scope', detail: 'Article scope is not allowlisted.' });
    const guarded = guardGeneratedResponse(article.answer, { maxOutputChars: 8000 });
    for (const violation of guarded.violations) issues.push({ articleId: id, code: `response_guard_${violation}`, detail: 'Article answer requires safety review.' });
    if (/\b(?:your app definitely stores|we permanently delete|we guarantee confidentiality|our server never sees)\b/iu.test(article.answer)) issues.push({ articleId: id, code: 'unverified_privacy_claim', detail: 'Privacy wording needs verification against the actual app and provider.' });
    if (article.scope === 'privacy_boundary' && !/depend|actual|configured|consent|settings|integration/iu.test(article.answer)) issues.push({ articleId: id, code: 'privacy_missing_qualification', detail: 'Explain that actual behavior depends on configured integration where appropriate.' });
  }
  return { totalArticles: articles.length, issues, valid: issues.length === 0 };
}
