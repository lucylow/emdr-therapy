import type { ChatToolId } from '../types.ts';

export interface PendingAction { id: string; toolId: ChatToolId; expiresAt: number; consumed: boolean; }

/** Creates single-use action confirmations for UI operations that change configuration or leave the app. */
export class ActionConfirmationStore {
  private actions = new Map<string, PendingAction>();
  private readonly ttlMs: number;
  private readonly maxPending: number;
  private readonly now: () => number;
  constructor(options: { ttlMs?: number; maxPending?: number; now?: () => number } = {}) {
    this.ttlMs = bounded(options.ttlMs, 60_000, 1000, 10 * 60_000);
    this.maxPending = bounded(options.maxPending, 20, 1, 100);
    this.now = options.now ?? Date.now;
  }
  issue(toolId: ChatToolId): PendingAction {
    this.cleanup();
    const id = randomToken();
    const action = { id, toolId, expiresAt: this.now() + this.ttlMs, consumed: false };
    this.actions.set(id, action);
    while (this.actions.size > this.maxPending) {
      const first = this.actions.keys().next().value as string | undefined;
      if (!first) break;
      this.actions.delete(first);
    }
    return { ...action };
  }
  consume(id: string, expectedTool: ChatToolId): boolean {
    this.cleanup();
    const pending = this.actions.get(String(id ?? ''));
    if (!pending || pending.consumed || pending.expiresAt <= this.now() || pending.toolId !== expectedTool) return false;
    pending.consumed = true;
    this.actions.delete(id);
    return true;
  }
  revoke(id?: string): void { if (id) this.actions.delete(id); else this.actions.clear(); }
  cleanup(): number {
    let removed = 0;
    for (const [id, action] of this.actions) if (action.expiresAt <= this.now() || action.consumed) { this.actions.delete(id); removed++; }
    return removed;
  }
  size(): number { this.cleanup(); return this.actions.size; }
}

function randomToken(): string {
  // Tokens are UI confirmation handles, not authentication credentials.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function bounded(value: unknown, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.floor(value as number))) : fallback; }
