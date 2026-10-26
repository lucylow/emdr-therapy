import type { ChatIntent, ChatTurnMetadata } from '../types.ts';
import type { EmotionLabel, Language, RiskLevel } from '../../types.ts';

export interface DerivedConversationSummary {
  turnsObserved: number;
  primaryIntents: Array<{ intent: ChatIntent; count: number }>;
  emotionCueCounts: Partial<Record<EmotionLabel, number>>;
  lastLanguage: Language;
  highestObservedRisk: RiskLevel;
  windowStart?: number;
  windowEnd?: number;
  disclaimer: string;
}

const RISK_ORDER: Record<RiskLevel, number> = { none: 0, possible: 1, high: 2, imminent: 3 };

/** Builds a summary exclusively from derived metadata. It cannot accept or store raw user messages. */
export function summarizeDerivedTurns(turns: ChatTurnMetadata[], maxIntents = 4): DerivedConversationSummary {
  const counts = new Map<ChatIntent, number>();
  const emotions: Partial<Record<EmotionLabel, number>> = {};
  let highestRisk: RiskLevel = 'none';
  for (const turn of turns) {
    counts.set(turn.intent, (counts.get(turn.intent) ?? 0) + 1);
    emotions[turn.emotion] = (emotions[turn.emotion] ?? 0) + 1;
    if (RISK_ORDER[turn.risk] > RISK_ORDER[highestRisk]) highestRisk = turn.risk;
  }
  const primaryIntents = [...counts.entries()]
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count || a.intent.localeCompare(b.intent))
    .slice(0, Math.max(1, Math.min(12, Math.floor(maxIntents))));
  const sortedTimes = turns.map((turn) => turn.timestamp).filter(Number.isFinite).sort((a, b) => a - b);
  return {
    turnsObserved: turns.length,
    primaryIntents,
    emotionCueCounts: emotions,
    lastLanguage: turns.at(-1)?.language ?? 'unknown',
    highestObservedRisk: highestRisk,
    windowStart: sortedTimes[0],
    windowEnd: sortedTimes.at(-1),
    disclaimer: 'Descriptive language cues only; not a clinical assessment or prediction.',
  };
}

export function formatDerivedSummary(summary: DerivedConversationSummary, language: Language = summary.lastLanguage): string {
  const top = summary.primaryIntents.slice(0, 3).map((row) => `${row.intent} (${row.count})`).join(', ');
  if (language === 'fr') return `Résumé descriptif de ${summary.turnsObserved} échanges. Thèmes de conversation fréquents : ${top || 'aucun thème récurrent détecté'}. Ceci ne constitue pas une évaluation clinique.`;
  if (language === 'es') return `Resumen descriptivo de ${summary.turnsObserved} turnos. Temas frecuentes: ${top || 'no se detectaron temas recurrentes'}. Esto no es una evaluación clínica.`;
  return `Descriptive summary of ${summary.turnsObserved} turns. Frequent conversation topics: ${top || 'no recurring topic detected'}. This is not a clinical assessment.`;
}
