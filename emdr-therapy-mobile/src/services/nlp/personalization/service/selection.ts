import type { ActivityRecommendation, SupportToolId } from '../core/types.ts';
import { auditRecommendation } from '../recommendations/quality.ts';

export type SelectionState = 'offered' | 'selected' | 'dismissed' | 'completed' | 'rated';
export interface SelectionRecord {
  readonly id: string;
  readonly activityId: SupportToolId;
  readonly state: SelectionState;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly rating?: 1 | 2 | 3 | 4 | 5;
}

export type SelectionEvent =
  | { readonly type: 'select'; readonly at: string }
  | { readonly type: 'dismiss'; readonly at: string }
  | { readonly type: 'complete'; readonly at: string }
  | { readonly type: 'rate'; readonly at: string; readonly rating: 1 | 2 | 3 | 4 | 5 };

const ALLOWED: Readonly<Record<SelectionState, readonly SelectionEvent['type'][]>> = {
  offered: ['select', 'dismiss'],
  selected: ['complete', 'dismiss'],
  dismissed: [],
  completed: ['rate'],
  rated: [],
};

/** State machine only tracks user choices. It never starts an activity or controls stimulation. */
export function transitionSelection(record: SelectionRecord, event: SelectionEvent): SelectionRecord {
  if (!Number.isFinite(new Date(event.at).getTime())) throw new Error('Invalid event timestamp');
  if (!ALLOWED[record.state].includes(event.type)) throw new Error(`Invalid transition: ${record.state} -> ${event.type}`);
  const state: SelectionState = event.type === 'select' ? 'selected'
    : event.type === 'dismiss' ? 'dismissed'
      : event.type === 'complete' ? 'completed' : 'rated';
  if (event.type === 'rate' && (![1, 2, 3, 4, 5].includes(event.rating))) throw new Error('Invalid rating');
  return { ...record, state, updatedAt: new Date(event.at).toISOString(), rating: event.type === 'rate' ? event.rating : record.rating };
}

export function createSelectionFromRecommendation(recommendation: ActivityRecommendation, id: string, now = new Date()): SelectionRecord {
  if (!auditRecommendation(recommendation).valid) throw new Error('Invalid recommendation');
  return { id, activityId: recommendation.activityId, state: 'offered', createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

export function assertSelectionRequiresUserAction(record: SelectionRecord): boolean {
  // A state requires further action only when at least one user-driven transition remains.
  return ALLOWED[record.state].length > 0;
}
