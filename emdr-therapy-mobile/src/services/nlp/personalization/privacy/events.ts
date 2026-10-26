import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { createId } from '../core/id.ts';
import type { Clock } from '../core/time.ts';
import { systemClock } from '../core/time.ts';
import type { PersonalizationEvent } from '../core/types.ts';
import type { PersonalizationRepository } from '../store/contracts.ts';

const FORBIDDEN_ATTRIBUTE_KEYS = /text|message|journal|note|email|phone|address|name|transcript|prompt|response|content|diagnos|symptom/i;
const PII_LIKE_VALUE = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b\+?\d[\d ().-]{7,}\d\b|https?:\/\/)/i;

export interface EventInput {
  readonly category: PersonalizationEvent['category'];
  readonly code: string;
  readonly attributes?: Readonly<Record<string, string | number | boolean>>;
}

export function sanitizeEvent(input: EventInput, now = new Date(), id = createId('evt', now)): PersonalizationEvent {
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input.attributes ?? {}).slice(0, 12)) {
    if (FORBIDDEN_ATTRIBUTE_KEYS.test(key)) continue;
    if (typeof value === 'string') {
      if (value.length > 48 || PII_LIKE_VALUE.test(value)) continue;
      if (!/^[a-zA-Z0-9._:-]*$/.test(value)) continue;
      attributes[key.slice(0, 40)] = value;
    } else if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) < 1_000_000) {
      attributes[key.slice(0, 40)] = value;
    } else if (typeof value === 'boolean') attributes[key.slice(0, 40)] = value;
  }
  const codeCandidate = typeof input.code === 'string' ? input.code.toLowerCase() : '';
  const code = /^[a-z0-9._:-]{1,48}$/.test(codeCandidate) && !PII_LIKE_VALUE.test(codeCandidate) ? codeCandidate : 'unspecified';
  return { eventId: id, createdAt: now.toISOString(), category: input.category, code: code || 'unspecified', attributes };
}

export class PrivacyEventLogger {
  private readonly repository: PersonalizationRepository;
  private readonly enabled: () => Promise<boolean>;
  private readonly clock: Clock;
  constructor(repository: PersonalizationRepository, enabled: () => Promise<boolean>, clock?: Clock) {
    this.repository = repository;
    this.enabled = enabled;
    this.clock = clock ?? systemClock;
  }
  async record(input: EventInput): Promise<void> {
    if (!(await this.enabled())) return;
    const event = sanitizeEvent(input, this.clock.now());
    await this.repository.appendEvent(event);
    const oldEvents = await this.repository.listEvents();
    if (oldEvents.length > PERSONALIZATION_LIMITS.maxEvents) await this.repository.replaceEvents(oldEvents.slice(-PERSONALIZATION_LIMITS.maxEvents));
  }
  async clear(): Promise<void> { await this.repository.replaceEvents([]); }
}

export function summarizeEvents(events: readonly PersonalizationEvent[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const event of events) counts[event.category] = (counts[event.category] ?? 0) + 1;
  return counts;
}
