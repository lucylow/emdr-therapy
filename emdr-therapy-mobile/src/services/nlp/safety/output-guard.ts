/** Guard candidate text if the app later adds a generative model. Prefer approved local templates. */
export interface GuardResult { text: string; blocked: boolean; reasons: string[]; }

const UNSAFE_OUTPUT_PATTERNS: Array<{ id: string; regex: RegExp }> = [
  { id: 'diagnosis_claim', regex: /\b(?:you have|you definitely have|this proves you have)\s+(?:ptsd|post[- ]traumatic stress disorder|a mental illness|a personality disorder)\b/i },
  { id: 'treatment_claim', regex: /\b(?:this will cure|guaranteed to heal|you are now cured|this treatment will fix)\b/i },
  { id: 'trauma_processing_instruction', regex: /\b(?:replay the trauma in detail|force yourself to relive|keep going through the memory|push through the distress)\b/i },
  { id: 'dependence_language', regex: /\b(?:only i understand you|you only need me|do not tell anyone else|keep this secret from your therapist)\b/i },
  { id: 'stimulation_escalation', regex: /\b(?:increase the intensity until it hurts|ignore the discomfort and continue|do not stop even if)\b/i },
  { id: 'medication_advice', regex: /\b(?:stop taking your medication|double your dose|change your prescription dose)\b/i },
];

export function guardAssistantOutput(candidate: string, maxChars = 1600): GuardResult {
  const text = String(candidate ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim().slice(0, maxChars);
  if (!text) return { text: '', blocked: true, reasons: ['empty_output'] };
  const reasons = UNSAFE_OUTPUT_PATTERNS.filter((pattern) => pattern.regex.test(text)).map((pattern) => pattern.id);
  if (reasons.length) {
    return {
      text: 'I can offer general wellbeing support, but I cannot make clinical judgments or encourage you to push through distress. You can pause, stop, or contact a qualified professional for guidance.',
      blocked: true,
      reasons,
    };
  }
  return { text, blocked: false, reasons: [] };
}
