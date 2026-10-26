import type { ConversationState, Intent } from '../types.ts';

const FOLLOW_UPS = /^(?:that|this|it|same|again|more|less|slower|faster|why|how come|what about that|that one|those|this one|as above)$/iu;

/** Resolves a few low-risk short follow-ups using derived state only; does not replay earlier text. */
export function resolveFollowUp(text: string, state?: ConversationState): Intent | null {
  const cleaned = String(text ?? '').trim().toLocaleLowerCase().replace(/[.!?]+$/u, '');
  if (!state || !FOLLOW_UPS.test(cleaned)) return null;
  switch (cleaned) {
    case 'slower': case 'less':
      return state.previousIntent === 'configure_stimulation' ? 'configure_stimulation' : null;
    case 'again':
      return state.previousIntent === 'grounding_request' || state.previousIntent === 'breathing_request' ? state.previousIntent : null;
    case 'that': case 'this': case 'it': case 'same': case 'more': case 'why': case 'how come': case 'what about that': case 'that one': case 'those': case 'this one': case 'as above':
      return state.previousIntent && state.previousIntent !== 'unknown' ? state.previousIntent : null;
    default: return null;
  }
}
