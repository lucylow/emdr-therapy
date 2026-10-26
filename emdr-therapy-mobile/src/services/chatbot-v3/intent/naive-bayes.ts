import type { Intent } from '../types.ts';
import { ngrams, tokenize } from '../text/tokenize.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';
import { EXPANDED_TRAINING_CORPUS } from './training-corpus.ts';

export interface TrainingExample { text: string; label: Intent; }
export interface BayesPrediction { label: Intent; confidence: number; margin: number; scores: Array<{ label: Intent; score: number }>; }

const BUILTIN_EXAMPLES: TrainingExample[] = [
  ...examples('greeting', ['hello', 'hi there', 'hey', 'good morning']),
  ...examples('goodbye', ['goodbye', 'bye', 'talk to you later', 'that is all']),
  ...examples('grounding_request', ['help me ground', 'I feel detached', 'bring me back to the present', 'five things I can see']),
  ...examples('breathing_request', ['help me breathe', 'guide a slow breathing exercise', 'box breathing please', 'breathing guidance']),
  ...examples('explain_app', ['what does this app do', 'how does this work', 'explain the app', 'what is bilateral stimulation']),
  ...examples('configure_stimulation', ['make it slower', 'turn off sound', 'change the movement speed', 'show visual settings']),
  ...examples('session_ready', ['I am ready', 'start a session', 'begin now', 'I want to begin']),
  ...examples('pause_request', ['pause please', 'I need a break', 'hold on a moment', 'pause the session']),
  ...examples('stop_request', ['stop now', 'end the session', 'turn this off', 'I want to stop']),
  ...examples('distress_share', ['I am overwhelmed', 'I feel anxious', 'this is too much', 'I feel frightened']),
  ...examples('positive_share', ['I feel better', 'I feel calmer', 'that helped', 'I feel hopeful']),
  ...examples('reflection_request', ['help me reflect', 'give me a journaling prompt', 'help me put this into words']),
  ...examples('privacy_question', ['is my information private', 'do you send my data online', 'delete my data']),
  ...examples('professional_support_request', ['find a therapist', 'I need professional help', 'talk to a counsellor']),
  ...examples('safety_concern', ['I might hurt myself', 'I do not feel safe', 'I am afraid I could hurt someone']),
  ...examples('feedback', ['this is confusing', 'I found a bug', 'something is broken']),
];

function examples(label: Intent, texts: string[]): TrainingExample[] {
  return texts.map((text) => ({ text, label }));
}

/** Small on-device multinomial Naive Bayes baseline. It is a routing aid, not clinical AI. */
export class LocalNaiveBayesIntentModel {
  private readonly documentCounts = new Map<Intent, number>();
  private readonly tokenCounts = new Map<Intent, Map<string, number>>();
  private readonly totalTokenCounts = new Map<Intent, number>();
  private readonly vocabulary = new Set<string>();
  private trained = false;

  constructor(examplesOverride?: TrainingExample[]) {
    this.train(examplesOverride ?? [...BUILTIN_EXAMPLES, ...EXPANDED_TRAINING_CORPUS]);
  }

  train(examples: TrainingExample[]): void {
    this.documentCounts.clear();
    this.tokenCounts.clear();
    this.totalTokenCounts.clear();
    this.vocabulary.clear();
    for (const example of examples) {
      const label = example.label;
      this.documentCounts.set(label, (this.documentCounts.get(label) ?? 0) + 1);
      const perClass = this.tokenCounts.get(label) ?? new Map<string, number>();
      const features = featureTokens(example.text);
      for (const feature of features) {
        this.vocabulary.add(feature);
        perClass.set(feature, (perClass.get(feature) ?? 0) + 1);
      }
      this.tokenCounts.set(label, perClass);
      this.totalTokenCounts.set(label, (this.totalTokenCounts.get(label) ?? 0) + features.length);
    }
    this.trained = examples.length > 0;
  }

  predict(text: string): BayesPrediction {
    if (!this.trained || this.documentCounts.size === 0) {
      return { label: 'unknown', confidence: 0, margin: 0, scores: [] };
    }
    const features = featureTokens(text);
    const totalDocs = [...this.documentCounts.values()].reduce((a, b) => a + b, 0);
    const vocabSize = Math.max(1, this.vocabulary.size);
    const logScores: Array<{ label: Intent; score: number }> = [];
    for (const [label, docCount] of this.documentCounts) {
      let score = Math.log(docCount / totalDocs);
      const counts = this.tokenCounts.get(label) ?? new Map<string, number>();
      const totalTokens = this.totalTokenCounts.get(label) ?? 0;
      for (const feature of features) {
        const count = counts.get(feature) ?? 0;
        // Laplace smoothing prevents a single unseen token from zeroing a class.
        score += Math.log((count + 1) / (totalTokens + vocabSize));
      }
      logScores.push({ label, score });
    }
    logScores.sort((a, b) => b.score - a.score);
    const max = logScores[0]?.score ?? 0;
    const exponentials = logScores.map((item) => Math.exp(item.score - max));
    const denominator = exponentials.reduce((a, b) => a + b, 0) || 1;
    const normalized = logScores.map((item, index) => ({ label: item.label, score: exponentials[index] / denominator }));
    normalized.sort((a, b) => b.score - a.score);
    return {
      label: normalized[0]?.label ?? 'unknown',
      confidence: normalized[0]?.score ?? 0,
      margin: (normalized[0]?.score ?? 0) - (normalized[1]?.score ?? 0),
      scores: normalized,
    };
  }

  getTrainingSummary(): { examples: number; classes: number; vocabulary: number } {
    return {
      examples: [...this.documentCounts.values()].reduce((a, b) => a + b, 0),
      classes: this.documentCounts.size,
      vocabulary: this.vocabulary.size,
    };
  }
}

function featureTokens(text: string): string[] {
  const normalized = normalizeForMatching(text);
  const tokens = tokenize(normalized).filter((token) => /[\p{L}\p{N}]/u.test(token));
  // Word-level and short phrase features support both terse controls and longer utterances.
  return ngrams(tokens, 1, 2);
}
