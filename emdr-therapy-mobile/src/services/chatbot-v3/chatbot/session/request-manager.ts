import type { ChatPhase } from '../types.ts';

export interface TurnLease {
  conversationId: string;
  revision: number;
  signal: AbortSignal;
  isCurrent(): boolean;
  finish(phase?: 'complete' | 'failed' | 'cancelled'): void;
}
interface InternalLease { revision: number; controller: AbortController; phase: ChatPhase; startedAt: number; }

/** Prevents stale async generations from overwriting a newer user turn. */
export class ChatRequestManager {
  private states = new Map<string, InternalLease>();
  private revisionCounter = 0;
  private readonly maxSessions: number;
  private readonly now: () => number;
  constructor(options: { maxSessions?: number; now?: () => number } = {}) {
    this.maxSessions = Math.max(1, Math.min(500, Math.floor(options.maxSessions ?? 32)));
    this.now = options.now ?? Date.now;
  }
  begin(conversationId: string): TurnLease {
    const id = safeId(conversationId);
    const existing = this.states.get(id);
    existing?.controller.abort(new Error('superseded_by_new_turn'));
    const controller = new AbortController();
    const revision = ++this.revisionCounter;
    this.states.delete(id);
    this.states.set(id, { revision, controller, phase: 'routing', startedAt: this.now() });
    this.enforceCapacity();
    return {
      conversationId: id,
      revision,
      signal: controller.signal,
      isCurrent: () => this.states.get(id)?.revision === revision && !controller.signal.aborted,
      finish: (phase = 'complete') => {
        const state = this.states.get(id);
        if (state?.revision === revision) state.phase = phase;
      },
    };
  }
  setPhase(conversationId: string, revision: number, phase: ChatPhase): boolean {
    const state = this.states.get(safeId(conversationId));
    if (!state || state.revision !== revision) return false;
    state.phase = phase;
    return true;
  }
  cancel(conversationId: string): boolean {
    const state = this.states.get(safeId(conversationId));
    if (!state) return false;
    state.controller.abort(new Error('cancelled_by_user'));
    state.phase = 'cancelled';
    return true;
  }
  phase(conversationId: string): ChatPhase | undefined { return this.states.get(safeId(conversationId))?.phase; }
  clear(conversationId?: string): void {
    if (conversationId) {
      const id = safeId(conversationId);
      this.states.get(id)?.controller.abort(new Error('session_cleared'));
      this.states.delete(id);
      return;
    }
    for (const state of this.states.values()) state.controller.abort(new Error('all_sessions_cleared'));
    this.states.clear();
  }
  diagnostics(): { active: number; phases: Record<string, number> } {
    const phases: Record<string, number> = {};
    for (const state of this.states.values()) phases[state.phase] = (phases[state.phase] ?? 0) + 1;
    return { active: this.states.size, phases };
  }
  private enforceCapacity(): void {
    while (this.states.size > this.maxSessions) {
      const oldest = this.states.keys().next().value as string | undefined;
      if (!oldest) break;
      this.states.get(oldest)?.controller.abort(new Error('capacity_eviction'));
      this.states.delete(oldest);
    }
  }
}
function safeId(value: string): string { return String(value ?? '').slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_') || 'default'; }
