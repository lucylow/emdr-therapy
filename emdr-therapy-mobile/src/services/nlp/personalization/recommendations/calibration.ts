import type { ActivityFeedbackRecord, SupportToolId } from '../core/types.ts';
import { parseIso } from '../core/time.ts';

export interface PreferenceCalibration {
  readonly activityId: SupportToolId;
  readonly sampleSize: number;
  readonly averageRating: number;
  readonly confidenceBand: 'insufficient' | 'tentative' | 'moderate' | 'stable';
  readonly shouldPersonalize: boolean;
  readonly note: string;
}

/** Conservative per-activity summary; it never estimates therapy outcome or user vulnerability. */
export function calibrateActivityPreference(records: readonly ActivityFeedbackRecord[], now = new Date(), days = 180): readonly PreferenceCalibration[] {
  const cutoff = now.getTime() - Math.max(7, Math.min(365, days)) * 86_400_000;
  const groups = new Map<SupportToolId, number[]>();
  for (const record of records) {
    const at = parseIso(record.createdAt);
    if (!at || at.getTime() > now.getTime() || at.getTime() < cutoff || record.skipped) continue;
    const values = groups.get(record.activityId) ?? [];
    values.push(record.helpfulness);
    groups.set(record.activityId, values);
  }
  return [...groups.entries()].map(([activityId, values]) => {
    const averageRating = values.reduce((sum, value) => sum + value, 0) / values.length;
    const confidenceBand: PreferenceCalibration['confidenceBand'] = values.length < 3 ? 'insufficient'
      : values.length < 5 ? 'tentative' : values.length < 10 ? 'moderate' : 'stable';
    return {
      activityId, sampleSize: values.length, averageRating, confidenceBand,
      shouldPersonalize: values.length >= 4 && (averageRating >= 4 || averageRating <= 2),
      note: values.length < 4 ? 'Not enough explicit feedback to personalize ranking.' : 'This reflects explicit ratings only and can be cleared at any time.',
    };
  }).sort((a, b) => b.sampleSize - a.sampleSize || a.activityId.localeCompare(b.activityId));
}

export function ensurePersonalizationBounded(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
