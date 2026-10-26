import type { ChatIntent } from '../types.ts';

export type DialogueStatus = 'idle' | 'awaiting_clarification' | 'awaiting_confirmation' | 'completed';
export interface DialogueSnapshot {
  conversationId: string;
  status: DialogueStatus;
  lastIntent?: ChatIntent;
  pendingPromptId?: string;
  pendingActionId?: string;
  pendingOptionIds: string[];
  acceptedActionCount: number;
  declinedActionCount: number;
  turnCount: number;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}
export interface DialogueTrackerOptions { maxConversations?: number; ttlMs?: number; now?: () => number; }

/**
 * Stores only derived state and explicit pending IDs—never message text, symptom content, or model prompts.
 * A new clarification overwrites the prior one so stale replies cannot silently confirm an old action.
 */
export class DialogueStateTracker {
  private readonly states = new Map<string, DialogueSnapshot>();
  private readonly now: () => number;
  private readonly maxConversations: number;
  private readonly ttlMs: number;
  constructor(options: DialogueTrackerOptions = {}) {
    this.now = options.now ?? Date.now;
    this.maxConversations = boundedInt(options.maxConversations, 32, 1, 500);
    this.ttlMs = boundedInt(options.ttlMs, 20 * 60_000, 1000, 24 * 60 * 60_000);
  }
  beginTurn(conversationId: string, intent?: ChatIntent): DialogueSnapshot {
    const id = safeId(conversationId);
    const now = this.now();
    this.prune(now);
    const old = this.states.get(id);
    const next: DialogueSnapshot = {
      conversationId: id, status: 'idle', lastIntent: intent ?? old?.lastIntent,
      pendingOptionIds: [], acceptedActionCount: old?.acceptedActionCount ?? 0,
      declinedActionCount: old?.declinedActionCount ?? 0, turnCount: (old?.turnCount ?? 0) + 1,
      createdAt: old?.createdAt ?? now, updatedAt: now, expiresAt: now + this.ttlMs,
    };
    this.states.set(id, next); this.evictOverflow(); return clone(next);
  }
  askClarification(conversationId: string, promptId: string, optionIds: string[]): DialogueSnapshot {
    return this.mutate(conversationId, (state) => ({ ...state, status: 'awaiting_clarification', pendingPromptId: safeId(promptId), pendingActionId: undefined, pendingOptionIds: cleanIds(optionIds) }));
  }
  requestConfirmation(conversationId: string, actionId: string, allowedActionIds: readonly string[]): DialogueSnapshot {
    if (!allowedActionIds.includes(actionId)) throw new Error('Action ID is not allowlisted for confirmation.');
    return this.mutate(conversationId, (state) => ({ ...state, status: 'awaiting_confirmation', pendingPromptId: undefined, pendingActionId: safeId(actionId), pendingOptionIds: [] }));
  }
  resolveClarification(conversationId: string, selectedOptionId: string): DialogueSnapshot {
    return this.mutate(conversationId, (state) => {
      if (state.status !== 'awaiting_clarification' || !state.pendingOptionIds.includes(selectedOptionId)) throw new Error('Selected option does not match the pending clarification.');
      return { ...state, status: 'completed', pendingPromptId: undefined, pendingActionId: undefined, pendingOptionIds: [] };
    });
  }
  resolveConfirmation(conversationId: string, actionId: string, accepted: boolean): DialogueSnapshot {
    return this.mutate(conversationId, (state) => {
      if (state.status !== 'awaiting_confirmation' || state.pendingActionId !== actionId) throw new Error('Confirmation is stale or does not match the pending action.');
      return { ...state, status: accepted ? 'completed' : 'idle', pendingPromptId: undefined, pendingActionId: undefined, pendingOptionIds: [], acceptedActionCount: state.acceptedActionCount + Number(accepted), declinedActionCount: state.declinedActionCount + Number(!accepted) };
    });
  }
  snapshot(conversationId: string): DialogueSnapshot | undefined {
    const state = this.states.get(safeId(conversationId));
    if (!state) return undefined;
    if (state.expiresAt <= this.now()) { this.states.delete(state.conversationId); return undefined; }
    return clone(state);
  }
  forget(conversationId?: string): void { if (conversationId === undefined) this.states.clear(); else this.states.delete(safeId(conversationId)); }
  size(): number { this.prune(this.now()); return this.states.size; }
  private mutate(idValue: string, edit: (state: DialogueSnapshot) => DialogueSnapshot): DialogueSnapshot {
    const id = safeId(idValue); const now = this.now(); this.prune(now);
    const current = this.states.get(id);
    if (!current) throw new Error('Dialogue state is missing or expired; begin a new turn first.');
    const next = edit({ ...current, pendingOptionIds: [...current.pendingOptionIds] });
    next.updatedAt = now; next.expiresAt = now + this.ttlMs;
    this.states.set(id, next); return clone(next);
  }
  private prune(now: number): void { for (const [id, state] of this.states) if (state.expiresAt <= now) this.states.delete(id); }
  private evictOverflow(): void { while (this.states.size > this.maxConversations) this.states.delete(this.states.keys().next().value as string); }
}
function safeId(value: string): string { const clean = String(value ?? '').slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_'); if (!clean) throw new Error('A non-empty opaque identifier is required.'); return clean; }
function cleanIds(values: string[]): string[] { return [...new Set(values.filter((value) => /^[a-zA-Z0-9._:-]{1,80}$/u.test(value)))].slice(0, 12); }
function boundedInt(value: number | undefined, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback; }
function clone(value: DialogueSnapshot): DialogueSnapshot { return { ...value, pendingOptionIds: [...value.pendingOptionIds] }; }
