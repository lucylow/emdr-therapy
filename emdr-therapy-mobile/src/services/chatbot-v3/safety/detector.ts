import type { SafetyCategory, SafetyResult } from '../types.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';
import { analyzeUtteranceContext } from '../text/clause-analysis.ts';

interface Signal { category: SafetyCategory; level: 'possible' | 'high' | 'imminent'; regex: RegExp; code: string; }

// These lexical signals are deliberately visible for independent review; this is not a validated crisis classifier.
const SIGNALS: Signal[] = [
  { category: 'suicide', level: 'imminent', regex: /\b(?:i am going to|i'm going to|i will|i plan to|tonight i will|right now i will)\s+(?:kill myself|end my life|take my own life)\b/u, code: 'explicit_imminent_suicide' },
  { category: 'suicide', level: 'high', regex: /\b(?:i want to|i wish i could|i might|thinking about|planning to)\s+(?:die|kill myself|end my life|not be alive|take my own life)\b/u, code: 'explicit_suicide_signal' },
  { category: 'suicide', level: 'high', regex: /\b(?:i have thoughts about|i keep thinking about|i am thinking about|thinking of)\s+(?:ending my life|suicide|killing myself|not being alive)\b/u, code: 'suicidal_thoughts_signal' },
  { category: 'self_harm', level: 'imminent', regex: /\b(?:i am going to|i'm going to|i will|i am about to)\s+(?:cut myself|hurt myself|harm myself|injure myself)\b/u, code: 'explicit_imminent_self_harm' },
  { category: 'self_harm', level: 'high', regex: /\b(?:i want to|i might|i feel like|thinking about)\s+(?:cutting myself|hurting myself|harming myself|self harm)\b/u, code: 'explicit_self_harm_signal' },
  { category: 'harm_to_others', level: 'imminent', regex: /\b(?:i am going to|i'm going to|i will|i am about to)\s+(?:kill|attack|seriously hurt)\s+(?:him|her|them|someone|my partner|my boss|people)\b/u, code: 'explicit_imminent_harm_others' },
  { category: 'harm_to_others', level: 'high', regex: /\b(?:i want to|i might|thinking about)\s+(?:kill|attack|hurt)\s+(?:him|her|them|someone|people)\b/u, code: 'explicit_harm_others' },
  { category: 'harm_to_others', level: 'high', regex: /\b(?:i may|i might|i am afraid i could|i am worried i may)\s+(?:hurt|harm|attack)\s+(?:somebody|someone|him|her|them|people)\b/u, code: 'possible_harm_others_signal' },
  { category: 'overdose', level: 'imminent', regex: /\b(?:i just took|i have taken|i took)\s+(?:too many|an overdose|a lot of pills|all my pills)\b/u, code: 'possible_overdose' },
  { category: 'medical_emergency', level: 'imminent', regex: /\b(?:i cannot breathe|i can't breathe|severe chest pain|i am having a seizure|i am unconscious)\b/u, code: 'possible_medical_emergency' },
  { category: 'abuse_or_immediate_danger', level: 'imminent', regex: /\b(?:someone is hurting me right now|i am being attacked|i am in immediate danger|they are threatening me right now)\b/u, code: 'immediate_external_danger' },
  { category: 'suicide', level: 'possible', regex: /\b(?:suicidal|suicide|want to disappear forever|wish i were dead|better off dead)\b/u, code: 'possible_suicide_reference' },
  { category: 'self_harm', level: 'possible', regex: /\b(?:self harm|self-harm|hurting myself|cutting myself)\b/u, code: 'possible_self_harm_reference' },
  { category: 'distress', level: 'possible', regex: /\b(?:i feel unsafe|i cannot cope|i am overwhelmed|i am panicking|i am terrified)\b/u, code: 'distress_language' },
  // French and Spanish coverage is intentionally basic, not a claim of equivalent sensitivity.
  { category: 'suicide', level: 'high', regex: /\b(?:je veux mourir|je veux me suicider|quiero morir|quiero suicidarme)\b/u, code: 'multilingual_suicide_signal' },
  { category: 'self_harm', level: 'high', regex: /\b(?:me faire du mal|hacerme daño|lastimarme)\b/u, code: 'multilingual_self_harm_signal' },
  { category: 'distress', level: 'possible', regex: /\b(?:je me sens dépassé|je ne suis pas en sécurité|me siento abrumado|no me siento seguro)\b/u, code: 'multilingual_distress' },
];

const QUOTE_OR_HYPOTHETICAL = /(?:^|\s)(?:the phrase|someone said|in a story|in my novel|hypothetically|for an assignment|quote:|quoted as|the lyrics say|the character says)\b/u;
const NEGATED = /\b(?:i do not want to|i don't want to|i dont want to|i am not going to|i'm not going to|i will not|i won't|i would never|not suicidal|no estoy pensando en|je ne veux pas)\b/u;

export function detectSafetySignals(input: string): SafetyResult {
  const text = normalizeForMatching(input);
  if (!text) return emptySafety();
  const context = analyzeUtteranceContext(input);
  const quotedOrHypothetical = QUOTE_OR_HYPOTHETICAL.test(text) || context.isQuotedOrHypothetical || context.isReportedSpeech;
  const negated = NEGATED.test(text);
  const matches = SIGNALS.filter((signal) => signal.regex.test(text));
  if (matches.length === 0) {
    return emptySafety();
  }
  const topLevel = matches.reduce<'possible' | 'high' | 'imminent'>((level, signal) => rank(signal.level) > rank(level) ? signal.level : level, 'possible');
  const selected = matches.find((signal) => signal.level === topLevel) ?? matches[0];
  // Quoted material or negation lowers certainty, but does not erase a potential safety concern.
  let level = topLevel;
  if (quotedOrHypothetical && level === 'imminent') level = 'high';
  if (negated && level === 'high') level = 'possible';
  const needsImmediateSupport = level === 'imminent';
  const confidence = level === 'imminent' ? 0.97 : level === 'high' ? (quotedOrHypothetical || negated ? 0.62 : 0.89) : 0.58;
  return {
    level,
    category: selected.category,
    confidence,
    needsImmediateSupport,
    matchedSignals: [...new Set(matches.map((match) => match.code))],
    quotedOrHypothetical,
    explanationCode: needsImmediateSupport ? 'immediate_danger_signal' : level === 'high' ? 'explicit_safety_signal' : 'possible_safety_signal',
  };
}

export function hasSafetySignal(input: string): boolean {
  return detectSafetySignals(input).level !== 'none';
}

function rank(level: 'possible' | 'high' | 'imminent'): number {
  return level === 'imminent' ? 3 : level === 'high' ? 2 : 1;
}

function emptySafety(): SafetyResult {
  return { level: 'none', category: 'none', confidence: 0.99, needsImmediateSupport: false, matchedSignals: [], quotedOrHypothetical: false, explanationCode: 'no_signal' };
}
