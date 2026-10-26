import type { ProfileSnapshot, PreferenceEntry, PreferenceKey } from '../core/types.ts';
import { isPreferenceKey, validatePreferenceValue } from '../core/validation.ts';

export interface ProfileQualityReport {
  readonly valid: boolean;
  readonly activeCount: number;
  readonly pendingCount: number;
  readonly invalidKeys: readonly string[];
  readonly malformedEntries: readonly string[];
  readonly staleObservedKeys: readonly PreferenceKey[];
  readonly duplicateProposalIds: boolean;
}

export function auditProfileQuality(profile: ProfileSnapshot, now = new Date(), staleAfterDays = 180): ProfileQualityReport {
  const invalidKeys: string[] = [];
  const malformedEntries: string[] = [];
  const staleObservedKeys: PreferenceKey[] = [];
  let activeCount = 0;
  let pendingCount = 0;
  for (const [rawKey, value] of Object.entries(profile.preferences)) {
    if (!isPreferenceKey(rawKey)) { invalidKeys.push(rawKey); continue; }
    if (!value || value.key !== rawKey || !validatePreferenceValue(rawKey, value.value)
      || !Number.isFinite(value.confidence) || value.confidence < 0 || value.confidence > 1
      || !Number.isInteger(value.evidenceCount) || value.evidenceCount < 0) {
      malformedEntries.push(rawKey); continue;
    }
    if (value.status === 'active') activeCount++;
    if (value.status === 'pending-review') pendingCount++;
    if (value.origin === 'observed' && value.status === 'active') {
      const at = new Date(value.lastSeenAt).getTime();
      if (!Number.isFinite(at) || at > now.getTime() || now.getTime() - at > staleAfterDays * 86_400_000) staleObservedKeys.push(rawKey);
    }
  }
  const allIds = [...profile.dismissedProposalIds, ...profile.acceptedProposalIds];
  return { valid: !invalidKeys.length && !malformedEntries.length, activeCount, pendingCount,
    invalidKeys, malformedEntries, staleObservedKeys, duplicateProposalIds: new Set(allIds).size !== allIds.length };
}

export function isSafePreferenceEntry(entry: PreferenceEntry): boolean {
  return isPreferenceKey(entry.key) && validatePreferenceValue(entry.key, entry.value)
    && entry.confidence >= 0 && entry.confidence <= 1 && entry.evidenceCount >= 0;
}
