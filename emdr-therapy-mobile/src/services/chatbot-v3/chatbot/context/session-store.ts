import type { ChatIntent, ChatSessionSnapshot, ChatTurnMetadata, StoredChatTurn } from '../types.ts';
import type { EmotionLabel, Language, RiskLevel } from '../../types.ts';

interface InternalSession {
  conversationId: string;
  turnCount: number;
  previousIntents: ChatIntent[];
  previousEmotion?: EmotionLabel;
  lastRisk: RiskLevel;
  language: Language;
  createdAt: number;
  updatedAt: number;
  rawTextRetained: boolean;
  turns: StoredChatTurn[];
}

export interface SessionStoreOptions {
  maxConversations?: number;
  maxHistoryTurns?: number;
  maxHistoryChars?: number;
  ttlMs?: number;
  now?: () => number;
}

/** In-memory only. Raw content is absent unless the user explicitly opts into local retention. */
export class EphemeralChatSessionStore {
  private sessions = new Map<string, InternalSession>();
  private readonly maxConversations: number;
  private readonly maxHistoryTurns: number;
  private readonly maxHistoryChars: number;
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(options: SessionStoreOptions = {}) {
    this.maxConversations = rangeInt(options.maxConversations, 32, 1, 500);
    this.maxHistoryTurns = rangeInt(options.maxHistoryTurns, 4, 0, 20);
    this.maxHistoryChars = rangeInt(options.maxHistoryChars, 2400, 0, 20000);
    this.ttlMs = rangeInt(options.ttlMs, 20 * 60 * 1000, 1000, 24 * 60 * 60 * 1000);
    this.now = options.now ?? Date.now;
  }

  read(conversationId: string): ChatSessionSnapshot | undefined {
    this.cleanupExpired();
    const session = this.sessions.get(safeConversationId(conversationId));
    return session ? snapshot(session) : undefined;
  }

  update(conversationId: string, metadata: ChatTurnMetadata): ChatSessionSnapshot {
    this.cleanupExpired();
    const id = safeConversationId(conversationId);
    const now = this.now();
    const previous = this.sessions.get(id);
    const intents = [...(previous?.previousIntents ?? []), metadata.intent].slice(-8);
    const next: InternalSession = {
      conversationId: id,
      turnCount: (previous?.turnCount ?? 0) + 1,
      previousIntents: intents,
      previousEmotion: metadata.emotion,
      lastRisk: metadata.risk,
      language: metadata.language === 'unknown' ? (previous?.language ?? 'unknown') : metadata.language,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      rawTextRetained: previous?.rawTextRetained ?? false,
      turns: previous?.turns ? [...previous.turns] : [],
    };
    this.sessions.delete(id);
    this.sessions.set(id, next);
    this.enforceCapacity();
    return snapshot(next);
  }

  appendTextTurn(conversationId: string, role: StoredChatTurn['role'], content: string, allowed: boolean): void {
    if (!allowed || this.maxHistoryTurns === 0 || this.maxHistoryChars === 0) return;
    this.cleanupExpired();
    const id = safeConversationId(conversationId);
    const session = this.sessions.get(id);
    if (!session) return;
    session.rawTextRetained = true;
    session.turns.push({ role, content: String(content).slice(0, this.maxHistoryChars), timestamp: this.now() });
    const maxTurns = this.maxHistoryTurns * 2;
    session.turns = session.turns.slice(-maxTurns);
    let total = session.turns.reduce((sum, turn) => sum + turn.content.length, 0);
    while (session.turns.length > 0 && total > this.maxHistoryChars) {
      const removed = session.turns.shift();
      total -= removed?.content.length ?? 0;
    }
    session.updatedAt = this.now();
  }

  readTurns(conversationId: string): StoredChatTurn[] {
    this.cleanupExpired();
    const session = this.sessions.get(safeConversationId(conversationId));
    if (!session || !session.rawTextRetained) return [];
    return session.turns.map((turn) => ({ ...turn }));
  }

  clear(conversationId?: string): void {
    if (conversationId) this.sessions.delete(safeConversationId(conversationId));
    else this.sessions.clear();
  }

  cleanupExpired(): number {
    const threshold = this.now() - this.ttlMs;
    let removed = 0;
    for (const [id, session] of this.sessions) {
      if (session.updatedAt < threshold) {
        this.sessions.delete(id);
        removed++;
      }
    }
    return removed;
  }

  size(): number { this.cleanupExpired(); return this.sessions.size; }

  /** Safe diagnostic snapshot: aggregate counts only, never conversation IDs or text. */
  diagnostics(): { sessions: number; sessionsWithRawText: number; retainedTurns: number } {
    this.cleanupExpired();
    let sessionsWithRawText = 0;
    let retainedTurns = 0;
    for (const session of this.sessions.values()) {
      if (session.rawTextRetained) sessionsWithRawText++;
      retainedTurns += session.turns.length;
    }
    return { sessions: this.sessions.size, sessionsWithRawText, retainedTurns };
  }

  private enforceCapacity(): void {
    while (this.sessions.size > this.maxConversations) {
      const oldest = this.sessions.keys().next().value as string | undefined;
      if (!oldest) break;
      this.sessions.delete(oldest);
    }
  }
}

function safeConversationId(value: string): string {
  const result = String(value ?? '').slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_');
  return result || 'default';
}

function snapshot(session: InternalSession): ChatSessionSnapshot {
  return {
    conversationId: session.conversationId,
    turnCount: session.turnCount,
    previousIntents: [...session.previousIntents],
    previousEmotion: session.previousEmotion,
    lastRisk: session.lastRisk,
    language: session.language,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    rawTextRetained: session.rawTextRetained,
  };
}

function rangeInt(value: unknown, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback;
}
