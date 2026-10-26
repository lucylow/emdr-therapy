import type { ChatMessage } from '../types.ts';
import { promptHasSystemPolicy, estimatePromptChars } from '../generation/prompt-builder.ts';

export interface RemotePayloadAudit {
  allowed: boolean;
  totalChars: number;
  messageCount: number;
  issues: Array<'missing_policy' | 'missing_user_message' | 'system_policy_not_first' | 'payload_too_large' | 'too_many_messages' | 'unredacted_contact_detail'>;
}

/** Final safety check before an adapter transmits prompt content over a network. */
export function auditRemotePayload(messages: ChatMessage[], options: { consented?: boolean; maxChars?: number; maxMessages?: number } = {}): RemotePayloadAudit {
  const issues: RemotePayloadAudit['issues'] = [];
  const totalChars = estimatePromptChars(messages);
  if (options.consented !== true) issues.push('missing_policy');
  if (!messages.some((message) => message.role === 'user' && message.content.trim())) issues.push('missing_user_message');
  if (messages[0]?.role !== 'system') issues.push('system_policy_not_first');
  else if (!promptHasSystemPolicy(messages)) issues.push('missing_policy');
  if (totalChars > (options.maxChars ?? 12000)) issues.push('payload_too_large');
  if (messages.length > (options.maxMessages ?? 12)) issues.push('too_many_messages');
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
  const phone = /(?<!\w)(?:\+?\d[\d().\- ]{7,}\d)(?!\w)/u;
  if (messages.some((message) => message.role !== 'system' && (email.test(message.content) || phone.test(message.content)))) issues.push('unredacted_contact_detail');
  return { allowed: issues.length === 0, totalChars, messageCount: messages.length, issues: [...new Set(issues)] };
}
