import type { ChatIntent, ResponseSource } from '../types.ts';

export type ProductEventName = 'turn_completed' | 'intent_uncertain' | 'provider_failed' | 'provider_succeeded' | 'guard_triggered' | 'feedback_received' | 'context_cleared';
export interface SafeProductEvent {
  name: ProductEventName;
  intent?: ChatIntent;
  source?: ResponseSource;
  count?: number;
  code?: string;
  timestamp: number;
}

/** Allowlisted category-only telemetry. This class never accepts a message or conversation ID. */
export class LocalProductTelemetry {
  private readonly maxEvents: number;
  private events: SafeProductEvent[] = [];
  private enabled: boolean;
  constructor(enabled = false, maxEvents = 500) {
    this.enabled = enabled === true;
    this.maxEvents = Math.max(1, Math.min(10000, Math.floor(maxEvents)));
  }
  setEnabled(enabled: boolean): void { this.enabled = enabled === true; if (!this.enabled) this.clear(); }
  record(event: Omit<SafeProductEvent, 'timestamp'>): void {
    if (!this.enabled || this.events.length >= this.maxEvents) return;
    if (!['turn_completed','intent_uncertain','provider_failed','provider_succeeded','guard_triggered','feedback_received','context_cleared'].includes(event.name)) return;
    this.events.push({
      name: event.name,
      intent: event.intent,
      source: event.source,
      count: typeof event.count === 'number' && Number.isFinite(event.count) ? Math.max(0, Math.min(100000, Math.floor(event.count))) : undefined,
      code: typeof event.code === 'string' ? event.code.slice(0, 64).replace(/[^a-z0-9_.:-]/giu, '_') : undefined,
      timestamp: Date.now(),
    });
  }
  readLocal(): SafeProductEvent[] { return this.events.map((event) => ({ ...event })); }
  clear(): void { this.events = []; }
  size(): number { return this.events.length; }
}
