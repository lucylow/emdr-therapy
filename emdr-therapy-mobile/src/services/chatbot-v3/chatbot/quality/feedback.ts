import type { ChatFeedbackEvent, ChatFeedbackSummary, ChatIntent, ResponseSource } from '../types.ts';

/** Keeps only categorical counters; never stores response text, user text, or conversation identifiers. */
export class LocalChatFeedbackCounter {
  private total = 0;
  private helpful = 0;
  private notHelpful = 0;
  private byIntent = new Map<string, { total: number; helpful: number }>();
  private byIssue = new Map<string, number>();
  private readonly maxEvents: number;

  constructor(maxEvents = 10000) { this.maxEvents = clampInt(maxEvents, 10000, 1, 1000000); }

  record(event: ChatFeedbackEvent): void {
    if (this.total >= this.maxEvents) return;
    const intent = isValidIntent(event.intent) ? event.intent : 'unknown';
    const rating = event.rating === 'helpful' ? 'helpful' : 'not_helpful';
    this.total++;
    if (rating === 'helpful') this.helpful++; else this.notHelpful++;
    const row = this.byIntent.get(intent) ?? { total: 0, helpful: 0 };
    row.total++;
    if (rating === 'helpful') row.helpful++;
    this.byIntent.set(intent, row);
    if (event.issue) this.byIssue.set(event.issue, (this.byIssue.get(event.issue) ?? 0) + 1);
  }

  summary(): ChatFeedbackSummary {
    const byIntent: ChatFeedbackSummary['byIntent'] = {};
    for (const [intent, value] of this.byIntent) byIntent[intent] = { ...value };
    const byIssue: Record<string, number> = {};
    for (const [issue, count] of this.byIssue) byIssue[issue] = count;
    return { total: this.total, helpful: this.helpful, notHelpful: this.notHelpful, byIntent, byIssue };
  }

  clear(): void { this.total = 0; this.helpful = 0; this.notHelpful = 0; this.byIntent.clear(); this.byIssue.clear(); }
}

export function feedbackIssueForText(text: string): ChatFeedbackEvent['issue'] {
  const value = String(text ?? '').toLowerCase();
  if (/unsafe|dangerous|harmful|risk/u.test(value)) return 'unsafe';
  if (/wrong intent|misunderstood|misunderstanding/u.test(value)) return 'wrong_intent';
  if (/too long|longer than/u.test(value)) return 'too_long';
  if (/too short|not enough detail/u.test(value)) return 'too_short';
  if (/tone|cold|patronizing|robotic/u.test(value)) return 'tone';
  if (/irrelevant|not related/u.test(value)) return 'irrelevant';
  return 'other';
}

export function createFeedbackEvent(input: { rating: 'helpful' | 'not_helpful'; intent: ChatIntent; source: ResponseSource; issue?: ChatFeedbackEvent['issue'] }): ChatFeedbackEvent {
  return { rating: input.rating, intent: input.intent, source: input.source, issue: input.issue, timestamp: Date.now() };
}

function isValidIntent(value: string): value is ChatIntent {
  return ['greeting','goodbye','app_help','explain_emdr','grounding','breathing','share_feelings','reflection','configure_stimulation','pause','stop','privacy','professional_support','safety_support','feedback','clarify','unknown'].includes(value);
}
function clampInt(value: number, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value))) : fallback; }
