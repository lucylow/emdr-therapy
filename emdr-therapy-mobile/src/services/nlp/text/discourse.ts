import { normalizeForMatching } from './normalize-base.ts';
import { classifyQuestionType } from './morphology.ts';
import type { Language } from '../types.ts';

export interface DiscourseFeatures {
  isQuestion: boolean;
  questionType: ReturnType<typeof classifyQuestionType>;
  containsNegation: boolean;
  containsUncertainty: boolean;
  containsCorrection: boolean;
  containsContrast: boolean;
  containsFirstPerson: boolean;
  containsSecondPerson: boolean;
  hasUrgencyMarker: boolean;
  hasPermissionLanguage: boolean;
  hasStopLanguage: boolean;
}

const NEGATION = /\b(?:not|never|no|don't|dont|can't|cannot|won't|isn't|aren't|pas|jamais|ne|nunca)\b/u;
const UNCERTAINTY = /\b(?:maybe|perhaps|not sure|i think|i guess|might|possibly|peut être|peut etre|peut-être|quizás|quizas|tal vez)\b/u;
const CORRECTION = /\b(?:i mean|actually|rather|instead|to clarify|what i meant|je veux dire|en fait|quiero decir|en realidad)\b/u;
const CONTRAST = /\b(?:but|however|although|though|yet|mais|pourtant|pero|sin embargo)\b/u;
const FIRST_PERSON = /\b(?:i|i'm|i am|me|my|je|j'ai|yo|me|mi)\b/u;
const SECOND_PERSON = /\b(?:you|your|tu|vous|votre|usted|ustedes)\b/u;
const URGENCY = /\b(?:now|right now|immediately|urgent|as soon as possible|maintenant|urgente|ahora mismo)\b/u;
const PERMISSION = /\b(?:can i|may i|is it okay|would it be okay|est-ce que je peux|puedo)\b/u;
const STOP = /\b(?:stop|pause|end the session|turn it off|arrête|pausa|detente|para ahora)\b/u;

/**
 * Extracts pragmatic signals to improve routing and safe clarification.
 * It does not determine truth, intent to act, or a person's psychological state.
 */
export function analyzeDiscourse(text: string, _language: Language): DiscourseFeatures {
  const normalized = normalizeForMatching(text);
  return {
    isQuestion: /[?？]\s*$/u.test(text.trim()) || /^(?:what|why|how|when|where|who|can|could|do|does|is|are|what|comment|pourquoi|que|como|cuando|donde|quien|puedo)\b/u.test(normalized),
    questionType: classifyQuestionType(text),
    containsNegation: NEGATION.test(normalized),
    containsUncertainty: UNCERTAINTY.test(normalized),
    containsCorrection: CORRECTION.test(normalized),
    containsContrast: CONTRAST.test(normalized),
    containsFirstPerson: FIRST_PERSON.test(normalized),
    containsSecondPerson: SECOND_PERSON.test(normalized),
    hasUrgencyMarker: URGENCY.test(normalized),
    hasPermissionLanguage: PERMISSION.test(normalized),
    hasStopLanguage: STOP.test(normalized),
  };
}
