import type { PersonalizationSnapshot, ProfileSnapshot } from '../core/types.ts';
import type { PersonalizationRepository } from '../store/contracts.ts';
import { auditProfileQuality } from './quality.ts';

export interface ProfileSnapshotResult {
  readonly snapshot?: PersonalizationSnapshot;
  readonly warnings: readonly string[];
}

export async function createPersonalizationSnapshot(repository: PersonalizationRepository, profile: ProfileSnapshot, now = new Date()): Promise<ProfileSnapshotResult> {
  const [checkIns, activityFeedback, themeCounts] = await Promise.all([
    repository.listCheckIns(), repository.listActivityFeedback(), repository.listThemeCounts(),
  ]);
  const report = auditProfileQuality(profile, now);
  const warnings = [
    ...report.invalidKeys.map((key) => `Unrecognized preference key: ${key}`),
    ...report.malformedEntries.map((key) => `Preference needs review: ${key}`),
    ...(profile.settings.insightsEnabled ? [] : ['Insights are disabled.']),
    ...(profile.settings.usageLearningEnabled ? [] : ['Usage-based learning is disabled.']),
  ];
  return {
    snapshot: {
      profile,
      checkIns: checkIns.filter((record) => new Date(record.createdAt).getTime() <= now.getTime()),
      activityFeedback: activityFeedback.filter((record) => new Date(record.createdAt).getTime() <= now.getTime()),
      themeCounts,
      generatedAt: now.toISOString(),
    }, warnings,
  };
}

export function snapshotContainsRawUserText(snapshot: PersonalizationSnapshot): boolean {
  const allowed = new Set(['profile', 'checkIns', 'activityFeedback', 'themeCounts', 'generatedAt']);
  if (Object.keys(snapshot as unknown as Record<string, unknown>).some((key) => !allowed.has(key))) return true;
  return false;
}
