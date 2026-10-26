import type { AuditSummary, LocalDataBundle, PersonalizationEvent, ProfileSnapshot } from '../core/types.ts';

const RAW_CONTENT_KEYS = new Set(['rawText', 'journalText', 'messageBody', 'conversationText', 'transcript', 'freeText', 'noteText']);

export interface PrivacyAuditFinding {
  readonly path: string;
  readonly code: 'raw-content-field' | 'unexpected-depth' | 'oversized-string' | 'suspicious-value';
}

/** Audits data structures for accidental fields that should never persist. */
export function auditObjectForSensitiveFields(input: unknown, maxDepth = 12): readonly PrivacyAuditFinding[] {
  const findings: PrivacyAuditFinding[] = [];
  const seen = new WeakSet<object>();
  const walk = (value: unknown, path: string, depth: number): void => {
    if (depth > maxDepth) { findings.push({ path, code: 'unexpected-depth' }); return; }
    if (value === null || typeof value !== 'object') {
      if (typeof value === 'string' && value.length > 2000) findings.push({ path, code: 'oversized-string' });
      if (typeof value === 'string' && /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i.test(value)) findings.push({ path, code: 'suspicious-value' });
      return;
    }
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.slice(0, 2000).forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (RAW_CONTENT_KEYS.has(key)) findings.push({ path: `${path}.${key}`, code: 'raw-content-field' });
      walk(child, `${path}.${key}`, depth + 1);
    }
  };
  walk(input, '$', 0);
  return findings;
}

export function summarizeLocalData(profile: ProfileSnapshot, bundle: LocalDataBundle): AuditSummary {
  return {
    profilePreferenceCount: Object.values(profile.preferences).filter((item) => item && item.status === 'active').length,
    checkInCount: bundle.checkIns.length,
    activityFeedbackCount: bundle.activityFeedback.length,
    aggregateThemeCount: bundle.themeCounts.length,
    eventCount: bundle.events.length,
    containsRawJournalText: false,
    containsRawChatText: false,
  };
}

export function sanitizeEventAttributes(event: PersonalizationEvent): PersonalizationEvent {
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(event.attributes).slice(0, 12)) {
    if (/text|message|journal|note|email|phone|address|content|transcript/i.test(key)) continue;
    if (typeof value === 'string' && (value.length > 48 || /[@\n\r]/.test(value))) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    attributes[key] = value;
  }
  return { ...event, attributes };
}
