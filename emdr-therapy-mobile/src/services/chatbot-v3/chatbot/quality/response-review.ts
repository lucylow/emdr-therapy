import { guardGeneratedResponse } from '../generation/output-guard.ts';
import type { ChatIntent, ChatProfile } from '../types.ts';

export interface ResponseReview {
  accepted: boolean;
  flags: string[];
  sentenceCount: number;
  questionCount: number;
  characterCount: number;
  requiresTemplateFallback: boolean;
}

export interface ResponseReviewOptions {
  intent: ChatIntent;
  profile?: ChatProfile;
  maximumChars?: number;
  requireQuestionForClarification?: boolean;
}

/** A shallow quality gate for UX regressions; it does not measure factual truth or clinical safety. */
export function reviewResponse(text: string, options: ResponseReviewOptions): ResponseReview {
  const flags: string[] = [];
  const value = String(text ?? '').trim();
  const guard = guardGeneratedResponse(value, { maxOutputChars: options.maximumChars ?? 3600 });
  if (!guard.safe) flags.push(...guard.violations);
  const sentenceCount = countSentences(value);
  const questionCount = (value.match(/[?？]/gu) ?? []).length;
  if (!value) flags.push('empty');
  if (value.length > (options.maximumChars ?? 3600)) flags.push('too_long');
  if (questionCount > 3) flags.push('too_many_questions');
  if (options.intent === 'clarify' && options.requireQuestionForClarification !== false && questionCount === 0) flags.push('clarification_missing_question');
  if (value.length > 100 && /^\s*(?:as an ai language model|i am an ai language model)/iu.test(value)) flags.push('boilerplate_disclaimer');
  if (/\b(?:you must tell me everything|describe the traumatic memory in detail|keep going even if it hurts)\b/iu.test(value)) flags.push('coercive_disclosure');
  if (options.profile?.responseLength === 'brief' && sentenceCount > 4) flags.push('brief_profile_ignored');
  return {
    accepted: flags.length === 0,
    flags: [...new Set(flags)],
    sentenceCount,
    questionCount,
    characterCount: value.length,
    requiresTemplateFallback: flags.some((flag) => ['diagnosis_claim', 'clinical_certainty', 'medication_change', 'unsupervised_reprocessing', 'harmful_instruction', 'false_emergency_claim', 'guaranteed_outcome', 'empty'].includes(flag)),
  };
}

function countSentences(text: string): number {
  return text.trim() ? (text.match(/[.!?。！？]+(?:\s|$)/gu) ?? []).length || 1 : 0;
}
