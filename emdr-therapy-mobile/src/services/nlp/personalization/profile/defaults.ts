import { DEFAULT_PROFILE_SETTINGS } from '../core/config.ts';
import type { ProfileSnapshot } from '../core/types.ts';

export function createDefaultProfile(profileId: string, now = new Date()): ProfileSnapshot {
  const timestamp = now.toISOString();
  return {
    schemaVersion: 2,
    profileId,
    createdAt: timestamp,
    updatedAt: timestamp,
    preferences: {},
    dismissedProposalIds: [],
    acceptedProposalIds: [],
    settings: { ...DEFAULT_PROFILE_SETTINGS },
  };
}

export function emptyPreferences(): ProfileSnapshot['preferences'] { return {}; }

export function hasAnyActivePreference(profile: ProfileSnapshot): boolean {
  return Object.values(profile.preferences).some((entry) => entry?.status === 'active');
}

export function resetPersonalizationSettings(profile: ProfileSnapshot, now = new Date()): ProfileSnapshot {
  return {
    ...profile,
    updatedAt: now.toISOString(),
    preferences: {},
    dismissedProposalIds: [],
    acceptedProposalIds: [],
    settings: { ...DEFAULT_PROFILE_SETTINGS },
  };
}
