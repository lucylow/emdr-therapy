import type { InsightCard, LanguageCode, CheckInRecord } from '../core/types.ts';
import { dataLimitations } from './copy.ts';
import { buildSettlednessBaseline } from './baseline.ts';
import { buildSettlednessTrend } from './trend.ts';
import { buildWeeklyDigest } from './weekly-digest.ts';
import { filterInsightCards } from './card-policy.ts';

export interface SynthesisOptions {
  readonly optedIn: boolean;
  readonly insightsEnabled: boolean;
  readonly language: LanguageCode;
  readonly now?: Date;
  readonly seenIds?: ReadonlySet<string>;
  readonly maxCards?: number;
}

export interface SynthesisResult {
  readonly cards: readonly InsightCard[];
  readonly skipped: readonly { code: string; count: number }[];
  readonly approach: 'deterministic-templates';
  readonly rawMessagesUsed: false;
}

/** Local deterministic synthesis only. No remote LLM, raw message history, or clinical inference. */
export function synthesizeLocalInsights(records: readonly CheckInRecord[], options: SynthesisOptions): SynthesisResult {
  if (!options.optedIn || !options.insightsEnabled) {
    return { cards: [], skipped: [{ code: !options.optedIn ? 'consent-required' : 'feature-disabled', count: 1 }], approach: 'deterministic-templates', rawMessagesUsed: false };
  }
  const now = options.now ?? new Date();
  // Ratings and user-selected tags are separate signal types: an empty tag list must not
  // silently discard a consented rating from numeric trend calculations. The generated card
  // copy is template-based and screened independently below.
  const clean = records.filter((record) => record.aggregateConsent);
  const candidates: InsightCard[] = [];
  const trend = buildSettlednessTrend(clean, { enabled: true, now, windowDays: 28, language: options.language });
  if (trend.card) candidates.push({ ...trend.card, limitations: dataLimitations(options.language) });
  const baseline = buildSettlednessBaseline(clean, { enabled: true, now, days: 90 });
  if (baseline.card) candidates.push({ ...baseline.card, limitations: dataLimitations(options.language) });
  const digest = buildWeeklyDigest(clean, { enabled: true, language: options.language, now, days: 28 });
  candidates.push(...digest.cards.map((card) => ({ ...card, limitations: dataLimitations(options.language) })));
  const policy = filterInsightCards(candidates, { seenIds: options.seenIds, maximum: options.maxCards ?? 5 });
  return { cards: policy.cards, skipped: policy.removed.map((item) => ({ code: item.reasons[0] ?? 'filtered', count: 1 })), approach: 'deterministic-templates', rawMessagesUsed: false };
}

export function explainSynthesisApproach(language: LanguageCode): string {
  const copy: Record<LanguageCode, string> = {
    en: 'These summaries are created from optional check-in ratings and user-selected tags using local rules and transparent templates. There is no diagnosis, outcome prediction, or cross-user learning.',
    fr: 'Ces résumés sont créés localement à partir des évaluations facultatives et des étiquettes choisies, avec des règles et des modèles transparents. Il n’y a ni diagnostic, ni prédiction, ni apprentissage entre utilisateurs.',
    es: 'Estos resúmenes se generan localmente a partir de valoraciones opcionales y etiquetas elegidas, mediante reglas y plantillas transparentes. No hay diagnóstico, predicción ni aprendizaje entre usuarios.',
  };
  return copy[language];
}
