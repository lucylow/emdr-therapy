export interface AbuseSignal { code: string; matched: boolean; severity: 'low' | 'medium'; }
export interface AbuseReview { suspicious: boolean; signals: AbuseSignal[]; shouldUseLocalFallback: boolean; }

const MARKERS: Array<{ code: string; pattern: RegExp; severity: AbuseSignal['severity'] }> = [
  { code: 'system_prompt_exfiltration', pattern: /\b(?:show|reveal|print|repeat|leak)\s+(?:the\s+)?(?:system prompt|hidden instructions|developer message|private policy)\b/iu, severity: 'medium' },
  { code: 'policy_override', pattern: /\b(?:ignore|bypass|override|disable)\s+(?:all\s+)?(?:safety|previous instructions|guardrails|the rules)\b/iu, severity: 'medium' },
  { code: 'role_confusion', pattern: /\b(?:you are now|pretend to be|act as an unrestricted|developer mode|jailbreak)\b/iu, severity: 'low' },
  { code: 'tool_execution_request', pattern: /\b(?:run this code|execute shell|execute a command|access another user's data|send my conversation to)\b/iu, severity: 'medium' },
];

/** This only decides when to prefer deterministic local output. It does not punish the user or block their ability to seek help. */
export function reviewPromptAbuseRisk(text: string): AbuseReview {
  const value = String(text ?? '').slice(0, 10000);
  const signals = MARKERS.map((rule) => ({ code: rule.code, matched: rule.pattern.test(value), severity: rule.severity })).filter((item) => item.matched);
  return {
    suspicious: signals.length > 0,
    signals,
    shouldUseLocalFallback: signals.some((signal) => signal.severity === 'medium'),
  };
}

export function normalizeAbuseMetric(review: AbuseReview): { suspicious: boolean; codes: string[] } {
  return { suspicious: review.suspicious, codes: review.signals.map((signal) => signal.code).slice(0, 4) };
}
