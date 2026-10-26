import type { ChatRequest, ChatTurnResult } from '../types.ts';
import { EmDrChatbot } from '../orchestrator.ts';
import { ChatRequestManager } from './request-manager.ts';
import { LocalChatRateLimiter } from './rate-limiter.ts';

export class ChatRateLimitError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) { super('Chat requests are arriving too quickly.'); this.name = 'ChatRateLimitError'; this.retryAfterMs = retryAfterMs; }
}
export class StaleChatTurnError extends Error {
  constructor() { super('This response was superseded by a newer turn.'); this.name = 'StaleChatTurnError'; }
}

/** UI-facing wrapper: prevents duplicate races and controls runaway turn frequency. */
export class ChatbotController {
  readonly chatbot: EmDrChatbot;
  readonly requests: ChatRequestManager;
  readonly rateLimiter: LocalChatRateLimiter;
  constructor(chatbot: EmDrChatbot, options: { requests?: ChatRequestManager; rateLimiter?: LocalChatRateLimiter } = {}) {
    this.chatbot = chatbot;
    this.requests = options.requests ?? new ChatRequestManager();
    this.rateLimiter = options.rateLimiter ?? new LocalChatRateLimiter();
  }

  async respond(request: ChatRequest): Promise<ChatTurnResult> {
    const key = safeId(request.conversationId);
    const rate = this.rateLimiter.check(key);
    if (!rate.allowed) throw new ChatRateLimitError(rate.retryAfterMs);
    const lease = this.requests.begin(key);
    try {
      this.requests.setPhase(key, lease.revision, 'generating');
      const response = await this.chatbot.respond(request, lease.signal);
      if (!lease.isCurrent()) throw new StaleChatTurnError();
      lease.finish('complete');
      return response;
    } catch (error) {
      lease.finish(lease.signal.aborted ? 'cancelled' : 'failed');
      throw error;
    }
  }

  cancel(conversationId: string): boolean { return this.requests.cancel(conversationId); }
  forget(conversationId?: string): void {
    this.requests.clear(conversationId);
    this.rateLimiter.reset(conversationId);
    this.chatbot.forget(conversationId);
  }
  diagnostics(): { requests: ReturnType<ChatRequestManager['diagnostics']>; rateLimiter: ReturnType<LocalChatRateLimiter['diagnostics']>; sessions: ReturnType<EmDrChatbot['sessions']['diagnostics']> } {
    return { requests: this.requests.diagnostics(), rateLimiter: this.rateLimiter.diagnostics(), sessions: this.chatbot.sessions.diagnostics() };
  }
}

export function createChatbotController(chatbot: EmDrChatbot, options?: { requests?: ChatRequestManager; rateLimiter?: LocalChatRateLimiter }): ChatbotController {
  return new ChatbotController(chatbot, options);
}
function safeId(value: string | undefined): string { return String(value ?? 'anonymous-session').slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_') || 'anonymous-session'; }
