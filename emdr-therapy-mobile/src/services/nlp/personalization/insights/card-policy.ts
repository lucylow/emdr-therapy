import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import type { InsightCard } from '../core/types.ts';
import { auditInsightCard } from './evidence.ts';
import { shouldDisplayNarrative } from './copy.ts';

export interface CardPolicyResult {
  readonly cards: readonly InsightCard[];
  readonly removed: readonly { id: string; reasons: readonly string[] }[];
}

/** Final display gate. NLP text should not bypass this guard, and it never controls session hardware. */
export function filterInsightCards(cards: readonly InsightCard[], options: {
  readonly seenIds?: ReadonlySet<string>;
  readonly maximum?: number;
  readonly maxBodyCharacters?: number;
} = {}): CardPolicyResult {
  const accepted: InsightCard[] = [];
  const removed: { id: string; reasons: string[] }[] = [];
  const seen = new Set(options.seenIds ?? []);
  const maximum = Math.max(0, Math.min(PERSONALIZATION_LIMITS.maxInsightCards, Math.floor(options.maximum ?? 5)));
  for (const card of cards) {
    const reasons: string[] = [];
    if (seen.has(card.id)) reasons.push('duplicate-or-dismissed');
    const audit = auditInsightCard(card);
    reasons.push(...audit.issues);
    if (!shouldDisplayNarrative(card.body, options.maxBodyCharacters ?? 1600)) reasons.push('narrative-policy-rejected');
    if (reasons.length) { removed.push({ id: card.id, reasons: [...new Set(reasons)] }); continue; }
    if (accepted.length >= maximum) { removed.push({ id: card.id, reasons: ['display-limit'] }); continue; }
    accepted.push(card);
    seen.add(card.id);
  }
  return { cards: accepted, removed };
}

export function assertNoUnsafeCardClaims(cards: readonly InsightCard[]): boolean {
  return cards.every((card) => shouldDisplayNarrative(card.title) && shouldDisplayNarrative(card.body));
}
