import { parseIso } from '../core/time.ts';
import type { InsightCard, InsightEvidence } from '../core/types.ts';

export interface EvidenceAudit {
  readonly valid: boolean;
  readonly issues: readonly string[];
}

export function auditEvidence(evidence: InsightEvidence): EvidenceAudit {
  const issues: string[] = [];
  if (!evidence.metric || evidence.metric.length > 80 || !/^[a-z0-9-]+$/.test(evidence.metric)) issues.push('invalid-metric-label');
  if (!Number.isInteger(evidence.sampleSize) || evidence.sampleSize < 0 || evidence.sampleSize > 100_000) issues.push('invalid-sample-size');
  const start = parseIso(evidence.windowStart);
  const end = parseIso(evidence.windowEnd);
  if (!start || !end) issues.push('invalid-window-date');
  else if (end.getTime() < start.getTime()) issues.push('window-end-before-start');
  if (evidence.value !== undefined && !Number.isFinite(evidence.value)) issues.push('invalid-value');
  if (evidence.baselineValue !== undefined && !Number.isFinite(evidence.baselineValue)) issues.push('invalid-baseline');
  if (!['low', 'moderate', 'higher'].includes(evidence.confidence)) issues.push('invalid-confidence');
  return { valid: issues.length === 0, issues };
}

export function auditInsightCard(card: InsightCard): EvidenceAudit {
  const issues: string[] = [];
  if (!card.id || card.id.length > 120 || !/^[a-zA-Z0-9._:-]+$/.test(card.id)) issues.push('invalid-card-id');
  if (!['pattern', 'reflection', 'preference', 'usage'].includes(card.kind)) issues.push('invalid-kind');
  if (!card.title || card.title.length > 120) issues.push('invalid-title');
  if (!card.body || card.body.length > 2400) issues.push('invalid-body');
  if (!parseIso(card.createdAt)) issues.push('invalid-created-at');
  if (!card.requiresUserOptIn) issues.push('must-require-opt-in');
  for (const evidence of card.evidence) issues.push(...auditEvidence(evidence).issues.map((code) => `evidence:${code}`));
  return { valid: issues.length === 0, issues };
}

export function evidenceIsSufficient(evidence: InsightEvidence, minimumSamples = 5): boolean {
  return auditEvidence(evidence).valid && evidence.sampleSize >= minimumSamples && evidence.confidence !== 'low';
}

export function downgradeEvidenceConfidence(evidence: InsightEvidence, factor: number): InsightEvidence {
  if (!Number.isFinite(factor) || factor < 0 || factor > 1) throw new Error('Invalid confidence factor');
  let confidence = evidence.confidence;
  if (factor < 0.4) confidence = 'low';
  else if (factor < 0.8 && confidence === 'higher') confidence = 'moderate';
  return { ...evidence, confidence };
}
