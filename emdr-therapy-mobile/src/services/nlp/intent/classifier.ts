import type { Intent, IntentResult, Language } from '../types.ts';
import { INTENTS, INTENT_PHRASES } from './phrases.ts';
import { LocalNaiveBayesIntentModel } from './naive-bayes.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';
import { ngrams, tokenize } from '../text/tokenize.ts';
import { fuzzyPhraseMatch } from './fuzzy-match.ts';
import { LocalTfidfIntentModel } from './tfidf.ts';
import type { NlpConfig } from '../types.ts';

const STOP_BEFORE_COMMAND = /\b(?:do not|don't|dont|never|not|no|avoid|cancel|without)\b/iu;
const DEFAULT_NAIVE_BAYES = new LocalNaiveBayesIntentModel();
const DEFAULT_TFIDF = new LocalTfidfIntentModel();

export function classifyIntent(text: string, config: NlpConfig, language: Language, model = DEFAULT_NAIVE_BAYES, tfidfModel = DEFAULT_TFIDF): IntentResult {
  const normalized = normalizeForMatching(text);
  const tokens = tokenize(normalized).filter((t) => /[\p{L}\p{N}]/u.test(t));
  if (!normalized) return fallbackResult();
  const candidates = new Map<Intent, number>(INTENTS.map((intent) => [intent, 0]));
  const phraseScore = scorePhrases(normalized, tokens, candidates, language);
  const modelResult = model.predict(normalized);
  const modelScores = new Map(modelResult.scores.map((row) => [row.label, row.score]));
  const semanticResult = tfidfModel.predict(normalized);
  const semanticScores = new Map(semanticResult.scores.map((row) => [row.label, row.score]));

  const combined = INTENTS.map((intent) => {
    const rule = phraseScore.get(intent) ?? 0;
    const bayes = modelScores.get(intent) ?? 0;
    const semantic = semanticScores.get(intent) ?? 0;
    let score = (rule * 0.60) + (bayes * 0.22) + (semantic * 0.18);
    if (rule === 0) score *= 0.75;
    // Nearest-neighbour evidence can help with paraphrases, but cannot trigger safety/control actions.
    const requiresExplicitSignal = ['safety_concern', 'stop_request', 'pause_request'].includes(intent);
    if (!requiresExplicitSignal && semanticResult.label === intent && semanticResult.similarity >= 0.38 && semanticResult.margin >= 0.06) {
      score = Math.max(score, Math.min(0.78, semanticResult.similarity * 0.58 + 0.18));
    }
    if (isNegatedIntent(text, intent)) score *= 0.12;
    return { intent, score, rule };
  }).sort((a, b) => b.score - a.score);

  let winner = combined[0];
  let runnerUp = combined[1];
  // Direct controls are exact and must not be diluted by a generic classifier.
  const control = detectDirectControl(normalized);
  if (control) {
    winner = { intent: control, score: 0.96, rule: 1 };
    runnerUp = { intent: combined.find((x) => x.intent !== control)?.intent ?? 'unknown', score: 0.01, rule: 0 };
  }
  const margin = Math.max(0, winner.score - (runnerUp?.score ?? 0));
  const confidence = Math.min(0.99, Math.max(0, winner.score));
  const unclear = winner.intent === 'unknown'
    || confidence < config.minIntentConfidence
    || margin < config.minIntentMargin;
  return {
    intent: unclear ? 'unknown' : winner.intent,
    confidence: Number(confidence.toFixed(3)),
    margin: Number(margin.toFixed(3)),
    source: phraseScore.get(winner.intent) ? 'hybrid' : 'fallback',
    alternatives: combined.slice(0, 3).map((item) => ({ intent: item.intent, score: Number(item.score.toFixed(3)) })),
    shouldClarify: unclear,
  };
}

function scorePhrases(text: string, tokens: string[], initial: Map<Intent, number>, language: Language): Map<Intent, number> {
  const scores = new Map(initial);
  const allNgrams = new Set(ngrams(tokens, 1, Math.min(5, Math.max(1, tokens.length))));
  const normalizedText = ` ${text} `;
  for (const rule of INTENT_PHRASES) {
    const phrase = normalizeForMatching(rule.phrase);
    const languageMatch = language === rule.language ? 1 : language === 'unknown' ? 0.85 : 0.7;
    const exactPhrase = allNgrams.has(phrase) || normalizedText.includes(` ${phrase} `);
    if (exactPhrase) {
      const current = scores.get(rule.intent) ?? 0;
      scores.set(rule.intent, Math.min(0.99, current + rule.weight * 0.47 * languageMatch));
      continue;
    }
    // Fuzzy matching only helps longer, ordinary requests; safety and direct controls require explicit patterns.
    if (tokens.length >= 2 && !['safety_concern', 'stop_request', 'pause_request'].includes(rule.intent)) {
      const fuzzy = fuzzyPhraseMatch(text, phrase);
      if (fuzzy.matched && fuzzy.similarity >= 0.75) {
        const current = scores.get(rule.intent) ?? 0;
        scores.set(rule.intent, Math.min(0.72, current + rule.weight * 0.22 * fuzzy.similarity * languageMatch));
      }
    }
  }
  // Additional soft cues make paraphrases somewhat more robust without claiming deep understanding.
  const cues: Array<{ intent: Intent; re: RegExp; weight: number }> = [
    { intent: 'pause_request', re: /\b(pause|break|wait|hold on|descanso|pausa|attends)\b/u, weight: 0.3 },
    { intent: 'stop_request', re: /\b(stop|stop now|end this|turn off|arrête|detente|para ahora)\b/u, weight: 0.35 },
    { intent: 'grounding_request', re: /\b(ground|present moment|five things|ancrage|presente|presente)\b/u, weight: 0.22 },
    { intent: 'breathing_request', re: /\b(breath|breathe|respir|respira)\b/u, weight: 0.22 },
    { intent: 'privacy_question', re: /\b(private|privacy|data|stored|delete|privé|données|datos|privacidad)\b/u, weight: 0.18 },
    { intent: 'distress_share', re: /\b(overwhelmed|scared|anxious|afraid|difficile|peur|ansioso|abrumado)\b/u, weight: 0.21 },
    { intent: 'professional_support_request', re: /\b(therapist|counsell?or|professional help|thérapeute|profesional)\b/u, weight: 0.25 },
  ];
  for (const cue of cues) {
    if (cue.re.test(text)) scores.set(cue.intent, Math.min(0.99, (scores.get(cue.intent) ?? 0) + cue.weight));
  }
  return scores;
}

function detectDirectControl(text: string): Intent | null {
  if (/^(please\s+)?(pause|pause now|take a break|wait|hold on)(\s+please)?$/u.test(text)) return 'pause_request';
  if (/^(please\s+)?(stop|stop now|end session|stop the session|turn it off|cancel)(\s+please)?$/u.test(text)) return 'stop_request';
  return null;
}

function isNegatedIntent(original: string, intent: Intent): boolean {
  if (!STOP_BEFORE_COMMAND.test(original)) return false;
  const normalized = normalizeForMatching(original);
  const checks: Partial<Record<Intent, RegExp>> = {
    pause_request: /\b(?:do not|don't|dont|never|not)\s+(?:pause|stop for a moment)\b/u,
    stop_request: /\b(?:do not|don't|dont|never|not)\s+stop\b/u,
    grounding_request: /\b(?:do not|don't|dont|never|not)\s+(?:ground|do grounding)\b/u,
    breathing_request: /\b(?:do not|don't|dont|never|not)\s+(?:breathe|do breathing)\b/u,
  };
  return checks[intent]?.test(normalized) ?? false;
}

function fallbackResult(): IntentResult {
  return { intent: 'unknown', confidence: 0, margin: 0, source: 'fallback', alternatives: [], shouldClarify: true };
}
