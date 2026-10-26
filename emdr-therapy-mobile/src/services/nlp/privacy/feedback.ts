import type { Intent, EmotionLabel, RiskLevel } from '../types.ts';

export interface FeedbackEvent { intent: Intent; emotion: EmotionLabel; safetyLevel: RiskLevel; helpful: boolean; }
export interface FeedbackSummary { total: number; helpful: number; unhelpful: number; byIntent: Record<string, number>; }

/** Optional in-memory aggregate feedback. No text, IDs, timestamps, or free-form notes are retained. */
export class LocalFeedbackCounter {
  private total = 0;
  private helpful = 0;
  private readonly byIntent = new Map<Intent, number>();
  private readonly maxEvents: number;

  constructor(maxEvents = 500) { this.maxEvents = Math.max(1, Math.floor(maxEvents)); }

  record(event: FeedbackEvent): void {
    if (this.total >= this.maxEvents) return;
    this.total += 1;
    if (event.helpful) this.helpful += 1;
    this.byIntent.set(event.intent, (this.byIntent.get(event.intent) ?? 0) + 1);
  }

  summary(): FeedbackSummary {
    return {
      total: this.total,
      helpful: this.helpful,
      unhelpful: this.total - this.helpful,
      byIntent: Object.fromEntries(this.byIntent.entries()),
    };
  }

  reset(): void { this.total = 0; this.helpful = 0; this.byIntent.clear(); }
}
