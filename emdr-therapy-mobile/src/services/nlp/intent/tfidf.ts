import type { Intent } from '../types.ts';
import { ngrams, tokenize } from '../text/tokenize.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';
import type { TrainingExample } from './naive-bayes.ts';
import { EXPANDED_TRAINING_CORPUS } from './training-corpus.ts';
import { INTENT_PHRASES } from './phrases.ts';

export interface TfidfPrediction {
  label: Intent;
  confidence: number;
  similarity: number;
  margin: number;
  scores: Array<{ label: Intent; score: number }>;
  matchedExamples: Array<{ label: Intent; similarity: number }>;
}
interface VectorizedExample { label: Intent; vector: Map<string, number>; norm: number; }

/**
 * Offline TF-IDF nearest-neighbour classifier. This is a lightweight local retrieval model,
 * not a transformer or embedding model. It gives the intent ensemble a second signal beyond rules.
 */
export class LocalTfidfIntentModel {
  private examples: VectorizedExample[] = [];
  private documentFrequency = new Map<string, number>();
  private documentCount = 0;
  private vocabulary = new Set<string>();

  constructor(examples: TrainingExample[] = defaultExamples()) { this.fit(examples); }

  fit(examples: TrainingExample[]): void {
    this.examples = [];
    this.documentFrequency.clear();
    this.vocabulary.clear();
    const documents = examples.map((item) => ({ label: item.label, features: features(item.text) }));
    this.documentCount = documents.length;
    for (const document of documents) {
      for (const term of new Set(document.features)) {
        this.vocabulary.add(term);
        this.documentFrequency.set(term, (this.documentFrequency.get(term) ?? 0) + 1);
      }
    }
    for (const document of documents) {
      const vector = this.vectorizeFeatures(document.features);
      this.examples.push({ label: document.label, vector, norm: vectorNorm(vector) });
    }
  }

  predict(text: string, neighborsPerClass = 3): TfidfPrediction {
    if (this.examples.length === 0) return { label: 'unknown', confidence: 0, similarity: 0, margin: 0, scores: [], matchedExamples: [] };
    const vector = this.vectorizeFeatures(features(text));
    const norm = vectorNorm(vector);
    if (norm === 0) return { label: 'unknown', confidence: 0, similarity: 0, margin: 0, scores: [], matchedExamples: [] };
    const nearest = this.examples.map((example) => ({ label: example.label, similarity: cosine(vector, norm, example.vector, example.norm) }))
      .sort((a, b) => b.similarity - a.similarity);
    const buckets = new Map<Intent, number[]>();
    for (const row of nearest) {
      const list = buckets.get(row.label) ?? [];
      list.push(row.similarity);
      buckets.set(row.label, list);
    }
    const raw = [...buckets.entries()].map(([label, values]) => {
      const top = values.sort((a, b) => b - a).slice(0, Math.max(1, neighborsPerClass));
      // Mean of the strongest neighbours penalizes classes supported by only a single weak hit.
      return { label, score: top.reduce((sum, value) => sum + value, 0) / top.length };
    }).sort((a, b) => b.score - a.score);
    const total = raw.reduce((sum, item) => sum + item.score ** 2, 0) || 1;
    const scores = raw.map((item) => ({ label: item.label, score: item.score ** 2 / total })).sort((a, b) => b.score - a.score);
    const similarity = nearest[0]?.similarity ?? 0;
    return {
      label: scores[0]?.label ?? 'unknown',
      confidence: scores[0]?.score ?? 0,
      similarity,
      margin: (scores[0]?.score ?? 0) - (scores[1]?.score ?? 0),
      scores,
      matchedExamples: nearest.slice(0, 3).map((item) => ({ label: item.label, similarity: Number(item.similarity.toFixed(3)) })),
    };
  }

  summary(): { examples: number; vocabulary: number; classes: number } {
    return { examples: this.documentCount, vocabulary: this.vocabulary.size, classes: new Set(this.examples.map((item) => item.label)).size };
  }

  private vectorizeFeatures(inputFeatures: string[]): Map<string, number> {
    const termCounts = new Map<string, number>();
    for (const term of inputFeatures) if (this.vocabulary.has(term)) termCounts.set(term, (termCounts.get(term) ?? 0) + 1);
    const vector = new Map<string, number>();
    for (const [term, count] of termCounts) {
      const documentFrequency = this.documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (this.documentCount + 1) / (documentFrequency + 1));
      vector.set(term, (1 + Math.log(count)) * idf);
    }
    return vector;
  }
}

function defaultExamples(): TrainingExample[] {
  return [
    ...EXPANDED_TRAINING_CORPUS,
    ...INTENT_PHRASES.map(({ intent, phrase }) => ({ label: intent, text: phrase })),
  ];
}

function features(text: string): string[] {
  const tokens = tokenize(normalizeForMatching(text)).filter((token) => /[\p{L}\p{N}]/u.test(token));
  return ngrams(tokens, 1, Math.min(2, Math.max(1, tokens.length)));
}

function vectorNorm(vector: Map<string, number>): number {
  let sum = 0;
  for (const value of vector.values()) sum += value * value;
  return Math.sqrt(sum);
}

function cosine(left: Map<string, number>, leftNorm: number, right: Map<string, number>, rightNorm: number): number {
  if (!leftNorm || !rightNorm) return 0;
  let dot = 0;
  for (const [term, value] of left) dot += value * (right.get(term) ?? 0);
  return Math.max(0, Math.min(1, dot / (leftNorm * rightNorm)));
}
