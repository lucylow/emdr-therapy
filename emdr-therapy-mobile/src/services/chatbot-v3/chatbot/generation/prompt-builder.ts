import { scrubForModel } from '../../privacy/redaction.ts';
import { buildSystemPrompt, profileToPromptPreferences } from './system-prompt.ts';
import type { ChatMessage, ChatProfile, PromptContext, StoredChatTurn } from '../types.ts';
import type { Language } from '../../types.ts';
import type { ChatIntent } from '../types.ts';

export interface PromptBuildInput {
  userText: string;
  language: Language;
  intent: ChatIntent;
  profile?: ChatProfile;
  previousIntents?: ChatIntent[];
  history?: StoredChatTurn[];
  allowHistory: boolean;
  maxInputChars?: number;
}

/** Redacts obvious contact details and bounds all remote prompt fields before creating a payload. */
export function buildProviderMessages(input: PromptBuildInput): ChatMessage[] {
  const context: PromptContext = {
    language: input.language,
    intent: input.intent,
    tone: input.profile?.tone ?? 'gentle',
    responseLength: input.profile?.responseLength ?? 'balanced',
    previousIntents: (input.previousIntents ?? []).slice(-4),
    approvedPreferenceSummary: profileToPromptPreferences(input.profile),
  };
  const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(context) }];
  if (input.allowHistory) {
    for (const turn of (input.history ?? []).slice(-6)) {
      if (turn.role !== 'user' && turn.role !== 'assistant') continue;
      const scrubbed = scrubForModel(turn.content, input.maxInputChars ?? 1200).text;
      if (scrubbed.trim()) messages.push({ role: turn.role, content: scrubbed });
    }
  }
  const current = scrubForModel(input.userText, input.maxInputChars ?? 2400).text;
  messages.push({ role: 'user', content: current });
  return messages;
}

export function promptHasSystemPolicy(messages: ChatMessage[]): boolean {
  const first = messages[0];
  return first?.role === 'system' && first.content.includes('NON-NEGOTIABLE BOUNDARIES');
}

export function estimatePromptChars(messages: ChatMessage[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}
