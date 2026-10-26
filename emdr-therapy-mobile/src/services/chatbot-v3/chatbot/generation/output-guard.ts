import { redactSensitiveText } from '../../privacy/redaction.ts';
import { truncateByCodePoints } from '../normalize.ts';
import type { ResponseGuardResult } from '../types.ts';

interface GuardRule { code: string; pattern: RegExp; }

/** Conservative patterns that block obvious clinical overreach; not a full semantic safety model. */
const RULES: GuardRule[] = [
  { code: 'diagnosis_claim', pattern: /\b(?:you (?:have|are suffering from|definitely have)|this proves you have|this confirms you have|i diagnose you with|your diagnosis is)\s+(?:ptsd|post[- ]traumatic stress|bipolar(?: disorder)?|borderline personality disorder|depression|anxiety disorder|dissociative identity disorder|ocd|adhd)\b/iu },
  { code: 'clinical_certainty', pattern: /\b(?:this confirms you have|this confirms|you clearly have|you definitely suffer from)\s+(?:a mental illness|a disorder|ptsd|trauma disorder|depression|anxiety disorder)\b/iu },
  { code: 'medication_change', pattern: /\b(?:stop taking|double|halve|increase|decrease|skip)\s+(?:your\s+)?(?:prescribed\s+)?(?:medication|meds|antidepressants|benzodiazepines|pills|dosage|dose)\b/iu },
  { code: 'unsupervised_reprocessing', pattern: /\b(?:relive your worst trauma|reprocess the traumatic memory alone|keep recalling the worst part|increase the stimulation until|push through the panic|stay with the traumatic memory no matter)\b/iu },
  { code: 'harmful_instruction', pattern: /\b(?:here is how to kill yourself|(?:ways|how) to make an overdose|how to hide self[- ]harm|instructions to seriously hurt someone)\b/iu },
  { code: 'false_emergency_claim', pattern: /\b(?:i have called emergency services|i contacted your therapist|an ambulance is on the way|i alerted your family)\b/iu },
  { code: 'guaranteed_outcome', pattern: /\b(?:this will cure you|guaranteed to heal your trauma|you will definitely recover if|emdr always works)\b/iu },
];

export interface GuardOptions { maxOutputChars?: number; redactContactDetails?: boolean; }

export function guardGeneratedResponse(rawText: string, options: GuardOptions = {}): ResponseGuardResult {
  const source = typeof rawText === 'string' ? rawText.trim() : '';
  const violations = RULES.filter((rule) => rule.pattern.test(source)).map((rule) => rule.code);
  if (violations.length > 0) {
    return { safe: false, text: '', violations, modified: true };
  }
  const max = Math.max(80, Math.min(20000, Math.floor(options.maxOutputChars ?? 3600)));
  let text = truncateByCodePoints(source, max).trim();
  if (options.redactContactDetails !== false) text = redactSensitiveText(text).text;
  if (!text) return { safe: false, text: '', violations: ['empty_response'], modified: true };
  // Do not surface accidental model control tokens or hidden prompt delimiters.
  text = text.replace(/<\|(?:system|assistant|user|im_start|im_end|endoftext)\|>/giu, '').trim();
  if (!text) return { safe: false, text: '', violations: ['control_token_only'], modified: true };
  return { safe: true, text, violations: [], modified: text !== source };
}

export function listOutputGuardRules(): string[] { return RULES.map((rule) => rule.code); }
