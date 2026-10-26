import { ChatIntentRouter } from '../routing/router.ts';
import type { ChatIntent, RouteResult } from '../types.ts';
import type { Language } from '../../types.ts';
import { normalizeChatInput } from '../normalize.ts';

export interface DetectedIntentSegment {
  intent: ChatIntent;
  confidence: number;
  textPreview: string;
  clauseIndex: number;
  sourceIntent: RouteResult['sourceIntent'];
}
export interface MultiIntentAnalysis {
  segments: DetectedIntentSegment[];
  uniqueIntents: ChatIntent[];
  primaryIntent?: ChatIntent;
  containsCompetingGoals: boolean;
  shouldClarify: boolean;
  reason: 'none' | 'single_goal' | 'compatible_goals' | 'competing_goals' | 'no_confident_goal';
}

const SEPARATORS: Record<'en' | 'fr' | 'es', RegExp> = {
  en: /(?:[.!?;\n]+|\b(?:and then|but also|and|but|also|then|plus)\b)/iu,
  fr: /(?:[.!?;\n]+|\b(?:et ensuite|mais aussi|et|mais|aussi|puis)\b)/iu,
  es: /(?:[.!?;\n]+|\b(?:y después|pero también|y|pero|también|luego)\b)/iu,
};
const CONTROL_INTENTS = new Set<ChatIntent>(['pause', 'stop']);
const PRIORITY: Record<ChatIntent, number> = {
  stop: 100, pause: 90, safety_support: 85, professional_support: 60, grounding: 55,
  breathing: 54, configure_stimulation: 50, privacy: 45, app_help: 40, explain_emdr: 35,
  share_feelings: 30, reflection: 28, feedback: 15, greeting: 10, goodbye: 10, clarify: 0, unknown: -1,
};
const COMPETING_PAIRS = new Set(['configure_stimulation|professional_support', 'configure_stimulation|share_feelings', 'configure_stimulation|privacy']);

/**
 * Detects conversational goals from independent clauses. This is advisory only: it never dispatches a control.
 * In particular, “please stop” inside a longer sentence cannot trigger the emergency-stop handler.
 */
export function analyzeMultiIntent(text: string, language: Language = 'unknown', router = new ChatIntentRouter()): MultiIntentAnalysis {
  const safe = normalizeChatInput(text, 2400).text;
  const locale = language === 'fr' || language === 'es' ? language : 'en';
  const clauses = splitClauses(safe, SEPARATORS[locale]).slice(0, 8);
  const segments: DetectedIntentSegment[] = [];
  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i]!.trim();
    if (!clause) continue;
    const result = router.route(clause, language);
    if (result.intent === 'unknown' || result.intent === 'clarify' || result.shouldClarify || result.confidence < 0.42 || CONTROL_INTENTS.has(result.intent)) continue;
    if (segments.some((segment) => segment.intent === result.intent)) continue;
    segments.push({ intent: result.intent, confidence: clamp(result.confidence), textPreview: Array.from(clause).slice(0, 120).join(''), clauseIndex: i, sourceIntent: result.sourceIntent });
  }
  const uniqueIntents = segments.map((segment) => segment.intent);
  const pairs = new Set(uniqueIntents.map((left) => uniqueIntents.map((right) => pairKey(left, right))).flat());
  const containsCompetingGoals = [...pairs].some((pair) => COMPETING_PAIRS.has(pair));
  const primary = [...segments].sort((a, b) => PRIORITY[b.intent] - PRIORITY[a.intent] || b.confidence - a.confidence)[0]?.intent;
  if (!segments.length) return { segments, uniqueIntents, primaryIntent: undefined, containsCompetingGoals: false, shouldClarify: true, reason: 'no_confident_goal' };
  if (segments.length === 1) return { segments, uniqueIntents, primaryIntent: primary, containsCompetingGoals: false, shouldClarify: false, reason: 'single_goal' };
  if (containsCompetingGoals) return { segments, uniqueIntents, primaryIntent: primary, containsCompetingGoals, shouldClarify: true, reason: 'competing_goals' };
  return { segments, uniqueIntents, primaryIntent: primary, containsCompetingGoals: false, shouldClarify: false, reason: 'compatible_goals' };
}

function splitClauses(text: string, separator: RegExp): string[] { return text.split(separator).map((part) => part.trim()).filter(Boolean); }
function pairKey(a: ChatIntent, b: ChatIntent): string { return [a, b].sort().join('|'); }
function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }
