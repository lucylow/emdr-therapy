import { INSIGHT_LIMITATIONS, PERSONALIZATION_LIMITS } from '../core/config.ts';
import type { CheckInRecord, InsightCard, InsightEvidence, ThemeId } from '../core/types.ts';
import { filterRatings, isoWeekday, type DatedRating } from './dates.ts';
import { mean } from './statistics.ts';
import { evidenceConfidence } from './suppression.ts';

const DAY_NAMES: Record<'en' | 'fr' | 'es', readonly string[]> = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
  es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
};

export interface DigestOptions {
  readonly enabled: boolean;
  readonly language: 'en' | 'fr' | 'es';
  readonly now?: Date;
  readonly days?: number;
}

export interface WeeklyDigestResult {
  readonly eligible: boolean;
  readonly reason?: 'disabled' | 'not-enough-data';
  readonly cards: readonly InsightCard[];
}

function createCard(id: string, title: string, body: string, createdAt: string, evidence: InsightEvidence[]): InsightCard {
  return {
    id, kind: 'usage', title, body, createdAt, evidence,
    limitations: [...INSIGHT_LIMITATIONS],
    actions: [{ id: 'view-details', label: 'View details' }, { id: 'dismiss', label: 'Dismiss' }, { id: 'clear-history', label: 'Clear history' }],
    requiresUserOptIn: true,
  };
}

export function buildWeeklyDigest(records: readonly CheckInRecord[], options: DigestOptions): WeeklyDigestResult {
  if (!options.enabled) return { eligible: false, reason: 'disabled', cards: [] };
  const now = options.now ?? new Date();
  const days = Math.max(7, Math.min(90, Math.floor(options.days ?? 28)));
  const ratings = filterRatings(records, now, days);
  if (ratings.length < PERSONALIZATION_LIMITS.minInsightSamples || new Set(ratings.map((r) => r.timestamp.slice(0, 10))).size < 3) {
    return { eligible: false, reason: 'not-enough-data', cards: [] };
  }
  const themeMap = new Map<ThemeId, number>();
  const dayMap = new Map<number, number>();
  for (const record of records) {
    if (!record.aggregateConsent) continue;
    const ts = new Date(record.createdAt).getTime();
    if (!Number.isFinite(ts) || ts > now.getTime() || ts < now.getTime() - days * 86_400_000) continue;
    for (const theme of record.selectedThemes) themeMap.set(theme, (themeMap.get(theme) ?? 0) + 1);
    const weekday = isoWeekday(record.createdAt);
    if (weekday) dayMap.set(weekday, (dayMap.get(weekday) ?? 0) + 1);
  }
  const cards: InsightCard[] = [];
  const sortedThemes = [...themeMap.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedThemes.length && sortedThemes[0][1] >= 2) {
    cards.push(createCard(
      `theme-frequency-${now.toISOString().slice(0, 10)}`,
      'Topics you chose to note',
      `In this window, you tagged “${sortedThemes[0][0].replace(/-/g, ' ')}” ${sortedThemes[0][1]} time(s). This only reflects the tags you selected; it does not explain why the topic appeared.`,
      now.toISOString(),
      [{ metric: 'user-selected-theme-count', sampleSize: sortedThemes.reduce((sum, item) => sum + item[1], 0), windowStart: new Date(now.getTime() - days * 86_400_000).toISOString(), windowEnd: now.toISOString(), value: sortedThemes[0][1], confidence: evidenceConfidence(ratings.length) }],
    ));
  }
  const topDay = [...dayMap.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDay && dayMap.size >= 3) {
    cards.push(createCard(
      `checkin-frequency-${now.toISOString().slice(0, 10)}`,
      'When you most often checked in',
      `Among the days logged in this window, ${DAY_NAMES[options.language][topDay[0] - 1]} had the most entries (${topDay[1]}). This describes logging frequency only.`,
      now.toISOString(),
      [{ metric: 'check-ins-by-weekday', sampleSize: ratings.length, windowStart: new Date(now.getTime() - days * 86_400_000).toISOString(), windowEnd: now.toISOString(), value: topDay[1], confidence: evidenceConfidence(ratings.length) }],
    ));
  }
  const average = mean(ratings.map((r: DatedRating) => r.rating));
  if (average !== undefined) {
    cards.push(createCard(
      `rating-summary-${now.toISOString().slice(0, 10)}`,
      'Your logged average',
      `Across ${ratings.length} check-ins you chose to include, the average settledness rating was ${average.toFixed(1)} out of 10. This is a summary of your own entries, not a clinical scale.`,
      now.toISOString(),
      [{ metric: 'settledness-rating-mean', sampleSize: ratings.length, windowStart: new Date(now.getTime() - days * 86_400_000).toISOString(), windowEnd: now.toISOString(), value: average, confidence: evidenceConfidence(ratings.length) }],
    ));
  }
  return { eligible: true, cards: cards.slice(0, PERSONALIZATION_LIMITS.maxInsightCards) };
}

export function topSelectedThemes(records: readonly CheckInRecord[], now = new Date(), days = 90, limit = 3): readonly { theme: ThemeId; count: number }[] {
  const counts = new Map<ThemeId, number>();
  const lower = now.getTime() - days * 86_400_000;
  for (const record of records) {
    if (!record.aggregateConsent) continue;
    const time = new Date(record.createdAt).getTime();
    if (!Number.isFinite(time) || time < lower || time > now.getTime()) continue;
    for (const theme of record.selectedThemes) counts.set(theme, (counts.get(theme) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.max(0, Math.min(10, limit))).map(([theme, count]) => ({ theme, count }));
}
