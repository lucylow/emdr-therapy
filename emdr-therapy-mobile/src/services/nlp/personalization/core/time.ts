import type { ISODate } from './types.ts';

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export class FixedClock implements Clock {
  private value: Date;
  constructor(value: string | Date) {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) throw new Error('FixedClock requires a valid date');
    this.value = parsed;
  }
  now(): Date { return new Date(this.value.getTime()); }
  set(value: string | Date): void {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) throw new Error('FixedClock requires a valid date');
    this.value = parsed;
  }
  advanceMilliseconds(amount: number): void {
    if (!Number.isFinite(amount)) throw new Error('Advance must be finite');
    this.value = new Date(this.value.getTime() + amount);
  }
}

export function toIso(date: Date): ISODate {
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid Date');
  return date.toISOString();
}

export function parseIso(value: string): Date | undefined {
  if (typeof value !== 'string' || value.length < 10 || value.length > 35) return undefined;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  // Require explicit timezone marker to avoid local-time ambiguity.
  if (!/(Z|[+-]\d\d:\d\d)$/i.test(value)) return undefined;
  return parsed;
}

export function dayDifference(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / 86_400_000;
}

export function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function addDays(value: Date, days: number): Date {
  if (!Number.isFinite(days)) throw new Error('Days must be finite');
  return new Date(value.getTime() + Math.round(days) * 86_400_000);
}

export function isWithinDays(timestamp: string, now: Date, days: number): boolean {
  const parsed = parseIso(timestamp);
  if (!parsed || parsed.getTime() > now.getTime()) return false;
  const delta = dayDifference(now, parsed);
  return delta >= 0 && delta <= days;
}

export function clampFutureTimestamp(timestamp: string, now: Date, skewHours: number): string | undefined {
  const parsed = parseIso(timestamp);
  if (!parsed) return undefined;
  if (parsed.getTime() > now.getTime() + skewHours * 3_600_000) return undefined;
  return parsed.toISOString();
}

export function utcDateKey(timestamp: string): string | undefined {
  const date = parseIso(timestamp);
  return date?.toISOString().slice(0, 10);
}
