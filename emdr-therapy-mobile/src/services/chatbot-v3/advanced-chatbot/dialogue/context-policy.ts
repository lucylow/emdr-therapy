import type { ChatMessage, Locale } from '../types.ts';
import { clampText, redactSensitiveText } from '../text.ts';

export type ContextPolicyInput = {
  messages: readonly ChatMessage[];
  includeHistory: boolean;
  historyConsent: boolean;
  localOnly: boolean;
  locale: Locale;
  maxMessages?: number;
  maxTotalChars?: number;
  maxMessageChars?: number;
};
export type ContextPolicyReason = 'history-not-requested' | 'consent-missing' | 'local-only' | 'bounded-context' | 'sensitive-text-redacted' | 'messages-dropped';
export type ContextPolicyResult = { messages: Array<{role:'user'|'assistant';content:string}>; chars: number; reasons: ContextPolicyReason[] };

/** Centralizes the conversation-history gate before a provider adapter can see prior turns. */
export function applyContextPolicy(input: ContextPolicyInput): ContextPolicyResult {
  const reasons: ContextPolicyReason[] = [];
  if (!input.includeHistory) reasons.push('history-not-requested');
  if (!input.historyConsent) reasons.push('consent-missing');
  if (input.localOnly) reasons.push('local-only');
  if (!input.includeHistory || !input.historyConsent || input.localOnly) return {messages:[],chars:0,reasons};
  const maxMessages = clamp(input.maxMessages ?? 6, 0, 12);
  const maxTotalChars = clamp(input.maxTotalChars ?? 3000, 0, 8000);
  const maxMessageChars = clamp(input.maxMessageChars ?? 1000, 1, 2000);
  const selected = input.messages.filter((m): m is ChatMessage & {role:'user'|'assistant'} => m.role === 'user' || m.role === 'assistant').slice(-maxMessages);
  if (selected.length < input.messages.length) reasons.push('messages-dropped');
  const result: ContextPolicyResult['messages'] = [];
  let chars = 0;
  for (const message of selected) {
    if (chars >= maxTotalChars) { reasons.push('bounded-context'); break; }
    const raw = clampText(message.text, maxMessageChars);
    const safe = redactSensitiveText(raw);
    if (safe !== raw) reasons.push('sensitive-text-redacted');
    const content = safe.slice(0, Math.max(0, maxTotalChars - chars));
    if (!content) continue;
    result.push({role:message.role,content});
    chars += content.length;
    if (content.length < safe.length) reasons.push('bounded-context');
  }
  return {messages:result,chars,reasons:[...new Set(reasons)]};
}
function clamp(value:number,min:number,max:number):number{return Number.isFinite(value)?Math.max(min,Math.min(max,Math.floor(value))):min;}
