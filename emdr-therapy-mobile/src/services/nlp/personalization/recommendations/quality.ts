import type { ActivityRecommendation, SupportToolId } from '../core/types.ts';
import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { isSelectableActivity } from './catalog.ts';

export interface RecommendationAudit {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

export function auditRecommendation(item: ActivityRecommendation): RecommendationAudit {
  const issues: string[] = [];
  if (!isSelectableActivity(item.activityId)) issues.push('not-selectable');
  if (!Number.isFinite(item.score) || item.score < 0 || item.score > PERSONALIZATION_LIMITS.maxScore) issues.push('score-out-of-range');
  if (!Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1) issues.push('confidence-out-of-range');
  if (item.requiresExplicitSelection !== true) issues.push('must-require-selection');
  if (!Array.isArray(item.reasons) || item.reasons.length > 8 || item.reasons.some((reason) => reason.length > 120)) issues.push('invalid-reasons');
  if (!Array.isArray(item.caveats) || item.caveats.length > 8 || item.caveats.some((reason) => reason.length > 240)) issues.push('invalid-caveats');
  return { valid: issues.length === 0, issues };
}

export function uniqueRecommendations(items: readonly ActivityRecommendation[], max = 3): readonly ActivityRecommendation[] {
  const seen = new Set<SupportToolId>();
  const result: ActivityRecommendation[] = [];
  for (const item of items) {
    if (seen.has(item.activityId) || !auditRecommendation(item).valid) continue;
    seen.add(item.activityId);
    result.push(item);
    if (result.length >= Math.max(0, Math.min(PERSONALIZATION_LIMITS.maxRecommendations, max))) break;
  }
  return result;
}

export function visibleRankingConfidence(confidence: number, language: 'en' | 'fr' | 'es'): string {
  const normalized = Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0;
  const level = normalized >= 0.75 ? 'higher' : normalized >= 0.45 ? 'some' : 'limited';
  const copy = {
    en: { higher: 'Based on several explicit feedback entries', some: 'Based on some explicit feedback', limited: 'A general suggestion; little personal feedback is available' },
    fr: { higher: 'Fondé sur plusieurs commentaires explicites', some: 'Fondé sur certains commentaires explicites', limited: 'Suggestion générale; peu de commentaires personnels disponibles' },
    es: { higher: 'Basado en varios comentarios explícitos', some: 'Basado en algunos comentarios explícitos', limited: 'Sugerencia general; hay pocos comentarios personales disponibles' },
  };
  return copy[language][level];
}
