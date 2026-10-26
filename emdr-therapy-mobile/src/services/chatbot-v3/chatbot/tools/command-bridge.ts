import type { ChatAction, ChatToolId } from '../types.ts';
import { listChatToolDescriptors } from './action-recommender.ts';
import { ActionConfirmationStore } from './confirmation.ts';

export interface ChatCommandContext { payload?: Record<string, string | number | boolean>; }
export type ChatCommandHandler = (context: ChatCommandContext) => void | Promise<void>;
export type ChatCommandHandlers = Partial<Record<ChatToolId, ChatCommandHandler>>;
export interface DispatchRequest {
  action: ChatAction;
  origin: 'user_click' | 'model_output' | 'automation';
  confirmationToken?: string;
}
export interface DispatchResult { executed: boolean; reason: 'executed' | 'untrusted_origin' | 'confirmation_required' | 'confirmation_invalid' | 'tool_unavailable' | 'unknown_tool' | 'handler_failed'; toolId?: ChatToolId; }

/**
 * Only dispatches allowlisted, UI-triggered actions. Assistant/model text can suggest actions,
 * but must never directly execute them. The stop/pause handler should connect to session controls.
 */
export class ChatCommandBridge {
  private readonly confirmations: ActionConfirmationStore;
  private readonly handlers: ChatCommandHandlers;
  constructor(handlers: ChatCommandHandlers, confirmations = new ActionConfirmationStore()) {
    this.handlers = handlers;
    this.confirmations = confirmations;
  }
  prepareConfirmation(toolId: ChatToolId) { return this.confirmations.issue(toolId); }
  revokeConfirmation(token?: string): void { this.confirmations.revoke(token); }

  async dispatch(request: DispatchRequest): Promise<DispatchResult> {
    const action = request.action;
    const descriptor = listChatToolDescriptors().find((item) => item.id === action.id);
    if (!descriptor) return { executed: false, reason: 'unknown_tool' };
    if (request.origin !== 'user_click') return { executed: false, reason: 'untrusted_origin', toolId: action.id };
    if (descriptor.requiresConfirmation) {
      if (!request.confirmationToken) return { executed: false, reason: 'confirmation_required', toolId: action.id };
      if (!this.confirmations.consume(request.confirmationToken, action.id)) return { executed: false, reason: 'confirmation_invalid', toolId: action.id };
    }
    const handler = this.handlers[action.id];
    if (!handler) return { executed: false, reason: 'tool_unavailable', toolId: action.id };
    try {
      await handler({ payload: sanitizePayload(action.payload) });
      return { executed: true, reason: 'executed', toolId: action.id };
    } catch {
      return { executed: false, reason: 'handler_failed', toolId: action.id };
    }
  }
}

function sanitizePayload(payload: ChatAction['payload']): ChatCommandContext['payload'] {
  if (!payload) return undefined;
  const output: NonNullable<ChatCommandContext['payload']> = {};
  for (const [key, value] of Object.entries(payload).slice(0, 12)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/u.test(key)) continue;
    if (typeof value === 'string') output[key] = value.slice(0, 100);
    else if (typeof value === 'boolean') output[key] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) output[key] = Math.max(-1000000, Math.min(1000000, value));
  }
  return output;
}
