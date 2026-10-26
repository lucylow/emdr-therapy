import type { DialogueSnapshot, PendingQuestion, UserPreferences } from '../types.ts';
import type { AdvancedChatbotConfig } from '../config.ts';
import { sanitizePreferences } from '../config.ts';

function fresh(id: string, now: number): DialogueSnapshot {
  return { conversationId:id, turnCount:0, slots:[], preference:{}, updatedAt:now };
}
/** Ephemeral memory only. This class deliberately has no disk or network adapter. */
export class DialogueSessionStore {
  private readonly sessions = new Map<string, DialogueSnapshot>();
  constructor(private readonly config: AdvancedChatbotConfig) {}
  get(id: string, now = Date.now()): DialogueSnapshot {
    this.prune(now);
    const snapshot = this.sessions.get(id);
    if (!snapshot) return fresh(id, now);
    return cloneSnapshot(snapshot);
  }
  save(snapshot: DialogueSnapshot): void {
    this.sessions.set(snapshot.conversationId, cloneSnapshot(snapshot));
  }
  update(id: string, updater: (current: DialogueSnapshot) => DialogueSnapshot, now = Date.now()): DialogueSnapshot {
    const current = this.get(id, now);
    const next = updater(current);
    if (next.conversationId !== id) throw new Error('Conversation identity cannot change during update');
    next.updatedAt = now;
    this.save(next);
    return cloneSnapshot(next);
  }
  clear(id: string): void { this.sessions.delete(id); }
  clearAll(): void { this.sessions.clear(); }
  size(): number { return this.sessions.size; }
  prune(now = Date.now()): number {
    let removed = 0;
    for (const [key, snapshot] of this.sessions) {
      if (now - snapshot.updatedAt > this.config.sessionTtlMs) { this.sessions.delete(key); removed++; }
    }
    return removed;
  }
  setPreferences(id: string, prefs: UserPreferences, now = Date.now()): DialogueSnapshot {
    return this.update(id, s => ({ ...s, preference:{ ...s.preference, ...sanitizePreferences(prefs) } }), now);
  }
  setPending(id: string, pending: PendingQuestion, now = Date.now()): DialogueSnapshot {
    return this.update(id, s => ({ ...s, pending }), now);
  }
  clearPending(id: string, now = Date.now()): DialogueSnapshot {
    return this.update(id, s => ({ ...s, pending:undefined }), now);
  }
}
function cloneSnapshot(value: DialogueSnapshot): DialogueSnapshot {
  return { ...value, slots:value.slots.map(s => ({...s})), preference:{...value.preference}, pending:value.pending ? {...value.pending, options:[...value.pending.options]} : undefined };
}
