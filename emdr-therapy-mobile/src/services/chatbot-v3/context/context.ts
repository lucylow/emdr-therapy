import type { ConversationState, EmotionLabel, Intent, Language, RiskLevel } from '../types.ts';

/** Bounded ephemeral state. Message content is intentionally never kept. */
export class EphemeralConversationContext {
  private readonly states = new Map<string, ConversationState>();
  private readonly maxConversations: number;
  private readonly maxTopics: number;

  constructor(maxConversations = 30, maxTopics = 5) {
    this.maxConversations = Math.max(1, maxConversations);
    this.maxTopics = Math.max(1, maxTopics);
  }

  read(conversationId: string): ConversationState | undefined {
    const state = this.states.get(conversationId);
    return state ? structuredCloneSafe(state) : undefined;
  }

  update(input: {
    conversationId: string;
    intent: Intent;
    emotion: EmotionLabel;
    topics: string[];
    language: Language;
    safety: RiskLevel;
  }): ConversationState {
    const id = safeId(input.conversationId);
    const previous = this.states.get(id);
    const mergedTopics = [...new Set([...(previous?.recentTopics ?? []), ...input.topics])].slice(-this.maxTopics);
    const next: ConversationState = {
      turnCount: (previous?.turnCount ?? 0) + 1,
      previousIntent: input.intent,
      previousEmotion: input.emotion,
      recentTopics: mergedTopics,
      language: input.language === 'unknown' ? (previous?.language ?? 'unknown') : input.language,
      lastSafetyLevel: input.safety,
      revision: (previous?.revision ?? 0) + 1,
    };
    this.states.delete(id);
    this.states.set(id, next);
    while (this.states.size > this.maxConversations) {
      const oldest = this.states.keys().next().value;
      if (oldest === undefined) break;
      this.states.delete(oldest);
    }
    return structuredCloneSafe(next);
  }

  clear(conversationId?: string): void {
    if (conversationId) this.states.delete(safeId(conversationId));
    else this.states.clear();
  }

  size(): number { return this.states.size; }

  /** Snapshot contains only derived labels, never original user text. */
  snapshot(): Array<{ id: string; state: ConversationState }> {
    return [...this.states.entries()].map(([id, state]) => ({ id, state: structuredCloneSafe(state) }));
  }
}

function safeId(value: string): string {
  const id = String(value ?? '').slice(0, 100).replace(/[^a-zA-Z0-9._:-]/g, '_');
  return id || 'default';
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
