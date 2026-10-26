import { detectSafetySignals } from '../../safety/detector.ts';
import type { SafetyResult } from '../../types.ts';
import type { SafetyPolicyDecision } from '../types.ts';
import type { Language } from '../../types.ts';
import { getChatResponse } from '../localization/responses.ts';

export interface ChatSafetyDecision extends SafetyPolicyDecision {
  signal: SafetyResult;
  language: Language;
}

/** Rule-based safety gate. It is conservative and not a validated crisis classifier. */
export function evaluateChatSafety(text: string, language: Language = 'unknown'): ChatSafetyDecision {
  const signal = detectSafetySignals(text);
  if (signal.level === 'imminent' || signal.needsImmediateSupport) {
    const key = signal.category === 'medical_emergency' || signal.category === 'overdose' ? 'urgent_medical' : 'imminent_danger';
    return { override: true, responseKey: key, requiresHumanSupport: true, reasonCode: signal.explanationCode, signal, language };
  }
  if (signal.level === 'high') {
    return { override: true, responseKey: signal.category === 'distress' ? 'distress_check' : 'possible_self_harm', requiresHumanSupport: true, reasonCode: signal.explanationCode, signal, language };
  }
  if (signal.level === 'possible') {
    return { override: false, responseKey: 'uncertain_safety', requiresHumanSupport: false, reasonCode: signal.explanationCode, signal, language };
  }
  return { override: false, responseKey: 'none', requiresHumanSupport: false, reasonCode: 'no_signal', signal, language };
}

export function safetyResponse(decision: ChatSafetyDecision): string | undefined {
  if (!decision.override || !decision.responseKey) return undefined;
  const key = decision.responseKey === 'imminent_danger' || decision.responseKey === 'urgent_medical' ? 'urgent_safety' : 'safety_support';
  return getChatResponse(key, decision.language);
}
