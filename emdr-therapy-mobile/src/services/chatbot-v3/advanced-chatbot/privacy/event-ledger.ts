import type { Locale } from '../types.ts';

export type SafeEventName = 'answer-local' | 'answer-remote-reviewed' | 'answer-fallback' | 'safety-route' | 'control-request' | 'clarification' | 'provider-error' | 'retrieval-miss' | 'consent-changed' | 'user-forgot';
export type PrivacySafeEvent = { name: SafeEventName; at: number; locale: Locale; durationMs?: number; ok: boolean };
export type EventTotals = { count: number; ok: number; failed: number; meanDurationMs?: number };
const ALLOWED = new Set<SafeEventName>(['answer-local','answer-remote-reviewed','answer-fallback','safety-route','control-request','clarification','provider-error','retrieval-miss','consent-changed','user-forgot']);

/** Bounded, count-oriented telemetry. It rejects arbitrary keys and never accepts prompts or outputs. */
export class SafeEventLedger {
  private readonly rows: PrivacySafeEvent[] = [];
  private readonly capacity: number;
  private readonly ttlMs: number;
  constructor(options: { capacity?: number; ttlMs?: number } = {}) {
    this.capacity = finiteInt(options.capacity ?? 300, 10, 5000);
    this.ttlMs = finiteInt(options.ttlMs ?? 7 * 86400_000, 60_000, 90 * 86400_000);
  }
  record(event: PrivacySafeEvent, now = Date.now()): boolean {
    if (!event || !ALLOWED.has(event.name) || !['en','fr','es'].includes(event.locale) || typeof event.ok !== 'boolean' || !Number.isFinite(event.at) || !Number.isFinite(now)) return false;
    if (event.at > now + 60_000 || event.at < now - this.ttlMs) return false;
    if (event.durationMs !== undefined && (!Number.isFinite(event.durationMs) || event.durationMs < 0 || event.durationMs > 300_000)) return false;
    this.prune(now);
    const clean: PrivacySafeEvent = { name: event.name, at: Math.floor(event.at), locale: event.locale, ok: event.ok };
    if (event.durationMs !== undefined) clean.durationMs = Math.round(event.durationMs);
    this.rows.push(clean);
    while (this.rows.length > this.capacity) this.rows.shift();
    return true;
  }
  aggregate(options: { since?: number; locale?: Locale; now?: number } = {}): Record<SafeEventName, EventTotals> {
    const now = options.now ?? Date.now(); this.prune(now);
    const names = [...ALLOWED];
    const output = Object.fromEntries(names.map(name => [name, { count: 0, ok: 0, failed: 0, durations: [] as number[] }])) as Record<SafeEventName, EventTotals & { durations: number[] }>;
    for (const row of this.rows) {
      if (options.since !== undefined && row.at < options.since) continue;
      if (options.locale && row.locale !== options.locale) continue;
      const value = output[row.name]; value.count++; row.ok ? value.ok++ : value.failed++;
      if (row.durationMs !== undefined) value.durations.push(row.durationMs);
    }
    return Object.fromEntries(names.map(name => {
      const v = output[name]; const { durations, ...rest } = v;
      return [name, { ...rest, ...(durations.length ? { meanDurationMs: Math.round(durations.reduce((a,b) => a+b,0) / durations.length) } : {}) }];
    })) as Record<SafeEventName, EventTotals>;
  }
  snapshot(now = Date.now()): PrivacySafeEvent[] { this.prune(now); return this.rows.map(r => ({ ...r })); }
  clear(): void { this.rows.length = 0; }
  get size(): number { return this.rows.length; }
  private prune(now: number): void { while (this.rows.length && this.rows[0]!.at < now - this.ttlMs) this.rows.shift(); }
}
function finiteInt(value: number, min: number, max: number): number { return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value))) : min; }
