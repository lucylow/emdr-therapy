import { isPlainObject } from '../core/validation.ts';
import type { ProfileSnapshot } from '../core/types.ts';

export const PROFILE_SCHEMA_VERSION = 2;

export interface MigrationResult {
  readonly profile?: ProfileSnapshot;
  readonly migrated: boolean;
  readonly issues: readonly string[];
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length <= 128 ? value : fallback;
}

/** Only known profile fields survive a migration; unrecognized fields are discarded. */
export function migrateProfile(input: unknown, now = new Date().toISOString()): MigrationResult {
  if (!isPlainObject(input)) return { migrated: false, issues: ['not-an-object'] };
  const issues: string[] = [];
  const version = Number(input.schemaVersion ?? 1);
  if (!Number.isInteger(version) || version < 1 || version > PROFILE_SCHEMA_VERSION) {
    return { migrated: false, issues: ['unsupported-schema-version'] };
  }
  if (version === PROFILE_SCHEMA_VERSION) {
    const profile = input as unknown as ProfileSnapshot;
    if (!profile.profileId || !profile.createdAt || !profile.updatedAt || !isPlainObject(profile.preferences)) {
      return { migrated: false, issues: ['invalid-current-profile'] };
    }
    return { profile, migrated: false, issues };
  }

  // V1 held a flatter `preferences` map. Convert only recognized values in profile service.
  const rawPreferences = isPlainObject(input.preferences) ? input.preferences : {};
  const preferences: ProfileSnapshot['preferences'] = Object.fromEntries(
    Object.entries(rawPreferences).filter(([key, value]) => typeof key === 'string' && value !== undefined),
  );
  issues.push('legacy-preferences-require-profile-service-validation');
  const profile: ProfileSnapshot = {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    profileId: asString(input.profileId, 'profile-legacy-import'),
    createdAt: asString(input.createdAt, now),
    updatedAt: now,
    preferences,
    dismissedProposalIds: Array.isArray(input.dismissedProposalIds) ? input.dismissedProposalIds.filter((x): x is string => typeof x === 'string').slice(-100) : [],
    acceptedProposalIds: Array.isArray(input.acceptedProposalIds) ? input.acceptedProposalIds.filter((x): x is string => typeof x === 'string').slice(-100) : [],
    settings: {
      personalizationEnabled: true, insightsEnabled: false, reflectionThemesEnabled: false,
      usageLearningEnabled: false, retentionDays: 180, language: 'en',
    },
  };
  return { profile, migrated: true, issues };
}

export function schemaCompatibility(version: unknown): 'current' | 'migratable' | 'unsupported' {
  if (!Number.isInteger(version)) return 'unsupported';
  if (version === PROFILE_SCHEMA_VERSION) return 'current';
  if (version === 1) return 'migratable';
  return 'unsupported';
}
