import type { ChatConsent, ChatIntent } from '../types.ts';
import type { RiskLevel } from '../../types.ts';

export type ModelRouteReason = 'enabled' | 'no_provider_consent' | 'global_remote_disabled' | 'local_only_requested' | 'safety_signal' | 'intent_requires_local' | 'prompt_injection_attempt' | 'provider_missing';
export interface ModelRouteDecision { allowed: boolean; reason: ModelRouteReason; }

const LOCAL_ONLY_INTENTS = new Set<ChatIntent>([
  'pause', 'stop', 'privacy', 'safety_support', 'professional_support', 'configure_stimulation', 'app_help', 'explain_emdr', 'grounding', 'breathing', 'unknown', 'clarify',
]);
const OVERRIDE_PATTERNS = [
  /\bignore (?:all )?(?:previous|prior|system) instructions\b/iu,
  /\b(?:show|print|reveal|repeat|leak) (?:(?:your|the) )?(?:system prompt|hidden instructions|secret policy|private policy|developer message)\b/iu,
  /\bdisable (?:your )?(?:safety|guardrails|content policy)\b/iu,
  /\bpretend (?:you are|to be) my therapist and diagnose\b/iu,
  /\b(?:developer mode|jailbreak|act as an unrestricted|bypass the rules|override all safety constraints)\b/iu,
];

export function hasPromptOverrideAttempt(text: string): boolean {
  return OVERRIDE_PATTERNS.some((pattern) => pattern.test(text));
}

export function decideModelRoute(input: {
  providerAvailable: boolean;
  globalRemoteEnabled: boolean;
  localOnly?: boolean;
  consent: ChatConsent;
  intent: ChatIntent;
  risk: RiskLevel;
  userText: string;
}): ModelRouteDecision {
  if (!input.providerAvailable) return { allowed: false, reason: 'provider_missing' };
  if (!input.globalRemoteEnabled) return { allowed: false, reason: 'global_remote_disabled' };
  if (input.localOnly === true) return { allowed: false, reason: 'local_only_requested' };
  if (!input.consent.remoteProcessing) return { allowed: false, reason: 'no_provider_consent' };
  if (input.risk !== 'none') return { allowed: false, reason: 'safety_signal' };
  if (LOCAL_ONLY_INTENTS.has(input.intent)) return { allowed: false, reason: 'intent_requires_local' };
  if (hasPromptOverrideAttempt(input.userText)) return { allowed: false, reason: 'prompt_injection_attempt' };
  return { allowed: true, reason: 'enabled' };
}

export function listLocalOnlyIntents(): ChatIntent[] { return [...LOCAL_ONLY_INTENTS]; }
