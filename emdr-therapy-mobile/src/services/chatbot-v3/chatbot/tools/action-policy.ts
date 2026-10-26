import type { ChatAction, ChatToolId } from '../types.ts';
import { isKnownToolId } from './action-recommender.ts';

export interface ActionPolicyOptions {
  /** Actions implemented and currently available in the host UI. Omission means the caller has not supplied a capability list. */
  availableActionIds?: readonly ChatToolId[];
  disabledActionIds?: readonly ChatToolId[];
  safetyOverride?: boolean;
  maxActions?: number;
}
export interface ActionPolicyReport { actions: ChatAction[]; removedUnknown: number; removedUnavailable: number; removedForSafety: number; deduplicated: number; capped: number; }

/** Filters UI suggestions against actual capabilities. It never executes an action. */
export function applyActionPolicy(actions: readonly ChatAction[], options: ActionPolicyOptions = {}): ActionPolicyReport {
  const available = options.availableActionIds ? new Set(options.availableActionIds) : undefined;
  const disabled = new Set(options.disabledActionIds ?? []);
  const max = Math.max(0, Math.min(6, Math.floor(options.maxActions ?? 4)));
  const selected: ChatAction[] = [];
  const seen = new Set<ChatToolId>();
  let removedUnknown = 0; let removedUnavailable = 0; let removedForSafety = 0; let deduplicated = 0;
  for (const action of actions) {
    if (!isKnownToolId(action.id)) { removedUnknown++; continue; }
    if (seen.has(action.id)) { deduplicated++; continue; }
    seen.add(action.id);
    if (disabled.has(action.id) || available && !available.has(action.id)) { removedUnavailable++; continue; }
    if (options.safetyOverride && action.reason !== 'safety_support') { removedForSafety++; continue; }
    selected.push({ ...action, payload: action.payload ? { ...action.payload } : undefined });
  }
  const capped = Math.max(0, selected.length - max);
  return { actions: selected.slice(0, max), removedUnknown, removedUnavailable, removedForSafety, deduplicated, capped };
}

export function actionNeedsExplicitConfirmation(actionId: string): boolean {
  return actionId === 'open_settings' || actionId === 'contact_support';
}
