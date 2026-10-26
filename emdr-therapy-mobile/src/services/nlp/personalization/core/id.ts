import type { Identifier } from './types.ts';
import { toIso } from './time.ts';

/** IDs are identifiers, never credentials or authentication tokens. */
export function createId(prefix: string, now = new Date(), random = Math.random): Identifier {
  const time = now.getTime().toString(36);
  const salt = Math.floor(Math.max(0, Math.min(0.999999999999, random())) * 0x1_0000_0000).toString(36);
  return `${prefix}-${time}-${salt}`.slice(0, 96);
}

export function makeEventId(now = new Date()): Identifier {
  return createId('evt', now);
}

export function dateStampedId(prefix: string, now = new Date()): Identifier {
  const stamp = toIso(now).replace(/[-:.TZ]/g, '').slice(0, 14);
  return `${prefix}-${stamp}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}
