import { LocalKnowledgeRetriever } from '../knowledge/retriever.ts';
import type { Language } from '../../types.ts';

export interface KnowledgeEvalCase { query: string; expectedArticleId: string; language: Exclude<Language, 'unknown'>; }
export interface KnowledgeEvalReport { total: number; top1Correct: number; top3Correct: number; top1Accuracy: number; top3Recall: number; failures: Array<{ query: string; expected: string; actual?: string }>; }

export function buildKnowledgeEvalCases(): KnowledgeEvalCase[] {
  return [
    { query: 'what is emdr', expectedArticleId: 'emdr-basics-en', language: 'en' },
    { query: 'what does EMDR stand for', expectedArticleId: 'emdr-basics-en', language: 'en' },
    { query: 'is this real therapy', expectedArticleId: 'app-limits-en', language: 'en' },
    { query: 'does the app replace a therapist', expectedArticleId: 'app-limits-en', language: 'en' },
    { query: 'where is the stop button', expectedArticleId: 'pause-stop-en', language: 'en' },
    { query: 'how do I pause stimulation', expectedArticleId: 'pause-stop-en', language: 'en' },
    { query: 'what data do you store', expectedArticleId: 'privacy-current-en', language: 'en' },
    { query: 'is my chat private', expectedArticleId: 'privacy-current-en', language: 'en' },
    { query: 'help me get present', expectedArticleId: 'grounding-en', language: 'en' },
    { query: 'breathing exercise', expectedArticleId: 'breathing-en', language: 'en' },
    { query: 'how to find a licensed EMDR clinician', expectedArticleId: 'professional-support-en', language: 'en' },
    { query: 'qu’est-ce que l’emdr', expectedArticleId: 'emdr-basics-fr', language: 'fr' },
    { query: 'le chatbot remplace-t-il un thérapeute', expectedArticleId: 'app-limits-fr', language: 'fr' },
    { query: 'où est le bouton arrêter', expectedArticleId: 'pause-stop-fr', language: 'fr' },
    { query: 'mes messages sont-ils privés', expectedArticleId: 'privacy-current-fr', language: 'fr' },
    { query: 'aide-moi à revenir au présent', expectedArticleId: 'grounding-fr', language: 'fr' },
    { query: 'exercice de respiration', expectedArticleId: 'breathing-fr', language: 'fr' },
    { query: 'trouver un professionnel formé à l’emdr', expectedArticleId: 'professional-support-fr', language: 'fr' },
    { query: 'qué significa emdr', expectedArticleId: 'emdr-basics-es', language: 'es' },
    { query: 'esto es terapia real', expectedArticleId: 'app-limits-es', language: 'es' },
    { query: 'dónde está el botón de parada', expectedArticleId: 'pause-stop-es', language: 'es' },
    { query: 'son privados mis mensajes', expectedArticleId: 'privacy-current-es', language: 'es' },
    { query: 'ayúdame a volver al presente', expectedArticleId: 'grounding-es', language: 'es' },
    { query: 'ejercicio de respiración', expectedArticleId: 'breathing-es', language: 'es' },
    { query: 'encontrar profesional formado en emdr', expectedArticleId: 'professional-support-es', language: 'es' },
  ];
}

export function evaluateKnowledgeBase(cases = buildKnowledgeEvalCases(), retriever = new LocalKnowledgeRetriever()): KnowledgeEvalReport {
  let top1Correct = 0;
  let top3Correct = 0;
  const failures: KnowledgeEvalReport['failures'] = [];
  for (const item of cases) {
    const results = retriever.search(item.query, { language: item.language, maxResults: 3, minimumScore: 0 });
    const actual = results[0]?.articleId;
    const top1 = actual === item.expectedArticleId;
    const top3 = results.slice(0, 3).some((result) => result.articleId === item.expectedArticleId);
    if (top1) top1Correct++;
    if (top3) top3Correct++;
    if (!top1) failures.push({ query: item.query, expected: item.expectedArticleId, actual });
  }
  const total = cases.length;
  return { total, top1Correct, top3Correct, top1Accuracy: total ? Number((top1Correct / total).toFixed(4)) : 0, top3Recall: total ? Number((top3Correct / total).toFixed(4)) : 0, failures };
}
