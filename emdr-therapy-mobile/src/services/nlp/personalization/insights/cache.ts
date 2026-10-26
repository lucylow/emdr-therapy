import type { InsightCard } from '../core/types.ts';

interface CacheEntry {
  readonly key: string;
  readonly createdAt: number;
  readonly profileRevision: string;
  readonly consentRevision: string;
  readonly cards: readonly InsightCard[];
}

/** Memory-only cache. Clears whenever profile or consent revision changes. */
export class InsightCache {
  private entry?: CacheEntry;
  private readonly ttlMilliseconds: number;
  constructor(ttlMilliseconds = 60_000) { this.ttlMilliseconds = ttlMilliseconds; }
  get(input: { readonly key: string; readonly profileRevision: string; readonly consentRevision: string; readonly now?: Date }): readonly InsightCard[] | undefined {
    const now = (input.now ?? new Date()).getTime();
    const value = this.entry;
    if (!value) return undefined;
    if (now < value.createdAt || now - value.createdAt > this.ttlMilliseconds || value.key !== input.key
      || value.profileRevision !== input.profileRevision || value.consentRevision !== input.consentRevision) {
      this.entry = undefined;
      return undefined;
    }
    return value.cards;
  }
  set(input: { readonly key: string; readonly profileRevision: string; readonly consentRevision: string; readonly cards: readonly InsightCard[]; readonly now?: Date }): void {
    this.entry = { key: input.key, profileRevision: input.profileRevision, consentRevision: input.consentRevision,
      createdAt: (input.now ?? new Date()).getTime(), cards: [...input.cards] };
  }
  clear(): void { this.entry = undefined; }
  get populated(): boolean { return !!this.entry; }
}

export function makeInsightCacheKey(input: { readonly from: string; readonly to: string; readonly language: string; readonly mode: string }): string {
  return [input.from.slice(0, 10), input.to.slice(0, 10), input.language.slice(0, 5), input.mode.slice(0, 24)].join('|');
}
