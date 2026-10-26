export type DataClass = 'raw_message' | 'derived_intent' | 'emotion_label' | 'risk_label' | 'aggregate_feedback' | 'remote_payload';
export interface RetentionRule { dataClass: DataClass; defaultEnabled: boolean; maximumRetentionMs: number; localOnlyByDefault: boolean; rationale: string; }
export interface RetentionDecision { allowed: boolean; reason: 'default_disabled' | 'consent_required' | 'duration_exceeded' | 'local_only' | 'allowed'; expiresAt?: number; }
export interface RetentionRequest { dataClass: DataClass; enabledByUser: boolean; remoteEnabled?: boolean; requestedDurationMs?: number; now?: number; }

/** Product policy reference; actual storage, encryption, deletion and backup controls must be implemented by the host app. */
export const DEFAULT_RETENTION_RULES: readonly RetentionRule[] = Object.freeze([
  { dataClass: 'raw_message', defaultEnabled: false, maximumRetentionMs: 20 * 60_000, localOnlyByDefault: true, rationale: 'Raw chat can contain sensitive information; keep only transient text when the user expressly enables it.' },
  { dataClass: 'derived_intent', defaultEnabled: true, maximumRetentionMs: 20 * 60_000, localOnlyByDefault: true, rationale: 'Derived routing context still requires minimization and a short TTL.' },
  { dataClass: 'emotion_label', defaultEnabled: true, maximumRetentionMs: 20 * 60_000, localOnlyByDefault: true, rationale: 'Emotion estimates are uncertain and should not become user profiles.' },
  { dataClass: 'risk_label', defaultEnabled: true, maximumRetentionMs: 20 * 60_000, localOnlyByDefault: true, rationale: 'Risk heuristics are sensitive and imperfect; use only transiently for routing.' },
  { dataClass: 'aggregate_feedback', defaultEnabled: false, maximumRetentionMs: 90 * 24 * 60 * 60_000, localOnlyByDefault: true, rationale: 'Optional categorical counters should not include text or identifiers.' },
  { dataClass: 'remote_payload', defaultEnabled: false, maximumRetentionMs: 0, localOnlyByDefault: false, rationale: 'Network transmission requires per-turn consent and a reviewed provider configuration.' },
]);

export function decideRetention(request: RetentionRequest, rules: readonly RetentionRule[] = DEFAULT_RETENTION_RULES): RetentionDecision {
  const rule = rules.find((item) => item.dataClass === request.dataClass);
  if (!rule) return { allowed: false, reason: 'default_disabled' };
  const now = Number.isFinite(request.now) ? request.now as number : Date.now();
  const requested = Number.isFinite(request.requestedDurationMs) ? Math.max(0, request.requestedDurationMs as number) : rule.maximumRetentionMs;
  if (request.dataClass === 'remote_payload' && request.enabledByUser !== true) return { allowed: false, reason: 'consent_required' };
  if (!rule.defaultEnabled && !request.enabledByUser) return { allowed: false, reason: 'default_disabled' };
  if (request.remoteEnabled && rule.localOnlyByDefault && request.dataClass !== 'remote_payload') return { allowed: false, reason: 'local_only' };
  if (requested > rule.maximumRetentionMs) return { allowed: false, reason: 'duration_exceeded' };
  if (requested === 0 && request.dataClass !== 'remote_payload') return { allowed: false, reason: 'duration_exceeded' };
  return { allowed: true, reason: 'allowed', expiresAt: request.dataClass === 'remote_payload' ? now : now + requested };
}
