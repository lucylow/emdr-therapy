import type { ChatMessage } from '../types.ts';

export interface ContextBudgetOptions { maxChars?: number; maxMessages?: number; }
export interface ContextBudgetResult { messages: ChatMessage[]; originalMessageCount: number; includedMessageCount: number; originalChars: number; includedChars: number; approximateTokens: number; droppedMessages: number; truncatedLatestUser: boolean; valid: boolean; }

/**
 * Compacts a candidate prompt without displacing the system policy or the most recent user request.
 * Token count is a rough budget estimate, not a tokenizer for any particular model.
 */
export function fitProviderMessages(messages: ChatMessage[], options: ContextBudgetOptions = {}): ContextBudgetResult {
  const maxChars = bounded(options.maxChars, 12000, 800, 50000);
  const maxMessages = bounded(options.maxMessages, 12, 2, 64);
  const originalChars = totalChars(messages);
  const system = messages[0]?.role === 'system' ? messages[0] : undefined;
  const latestUserIndex = findLastIndex(messages, (message) => message.role === 'user');
  if (!system || latestUserIndex < 1) {
    return { messages: [], originalMessageCount: messages.length, includedMessageCount: 0, originalChars, includedChars: 0, approximateTokens: 0, droppedMessages: messages.length, truncatedLatestUser: false, valid: false };
  }
  const mandatory = [system, messages[latestUserIndex]!];
  if (system.content.length >= maxChars) {
    return { messages: [clone(system)], originalMessageCount: messages.length, includedMessageCount: 1, originalChars, includedChars: system.content.length, approximateTokens: Math.ceil(system.content.length / 3.5), droppedMessages: messages.length - 1, truncatedLatestUser: false, valid: false };
  }
  const availableForLatestUser = maxChars - system.content.length;
  let latestUser = messages[latestUserIndex]!;
  let truncatedLatestUser = false;
  if (latestUser.content.length > availableForLatestUser) {
    latestUser = { role: 'user', content: clipFromEnd(latestUser.content, availableForLatestUser) };
    truncatedLatestUser = true;
  }
  const selected: ChatMessage[] = [clone(system), clone(latestUser)];
  let usedChars = selected[0]!.content.length + selected[1]!.content.length;
  // Retain the newest prior turns first. If the budget is exhausted, remove whole older messages rather than truncate them.
  let considered = 0;
  for (let i = latestUserIndex - 1; i >= 1; i--) {
    const candidate = messages[i]!;
    considered++;
    if (selected.length >= maxMessages || usedChars + candidate.content.length > maxChars) continue;
    selected.push(clone(candidate));
    usedChars += candidate.content.length;
  }
  const middle = selected.slice(2).reverse();
  const resultMessages = [selected[0]!, ...middle, selected[1]!];
  const includedChars = totalChars(resultMessages);
  return {
    messages: resultMessages,
    originalMessageCount: messages.length,
    includedMessageCount: resultMessages.length,
    originalChars,
    includedChars,
    approximateTokens: Math.ceil(includedChars / 3.5),
    droppedMessages: Math.max(0, messages.length - resultMessages.length),
    truncatedLatestUser,
    valid: resultMessages.length >= 2 && resultMessages[0]!.role === 'system' && resultMessages.at(-1)!.role === 'user' && includedChars <= maxChars,
  };
}

export function estimateApproximateTokens(text: string): number { return Math.ceil(Array.from(String(text ?? '')).length / 3.5); }
export function estimateMessagesTokens(messages: ChatMessage[]): number { return Math.ceil(totalChars(messages) / 3.5); }
function totalChars(messages: ChatMessage[]): number { return messages.reduce((total, message) => total + String(message.content ?? '').length, 0); }
function clone(message: ChatMessage): ChatMessage { return { role: message.role, content: message.content }; }
function findLastIndex<T>(values: T[], predicate: (value: T) => boolean): number { for (let i = values.length - 1; i >= 0; i--) if (predicate(values[i]!)) return i; return -1; }
function clipFromEnd(value: string, max: number): string { return Array.from(value).slice(-Math.max(0, max)).join(''); }
function bounded(value: number | undefined, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback; }
