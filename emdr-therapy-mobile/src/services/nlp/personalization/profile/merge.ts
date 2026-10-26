import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { parseIso } from '../core/time.ts';
import type { PreferenceEntry, PreferenceKey, PreferenceValue, ProfileSnapshot } from '../core/types.ts';

function newer(a: PreferenceEntry, b: PreferenceEntry): PreferenceEntry {
  const aTime = parseIso(a.lastSeenAt)?.getTime() ?? 0;
  const bTime = parseIso(b.lastSeenAt)?.getTime() ?? 0;
  if (a.origin === 'explicit' && b.origin !== 'explicit') return a;
  if (b.origin === 'explicit' && a.origin !== 'explicit') return b;
  if (aTime !== bTime) return aTime > bTime ? a : b;
  return a.revision >= b.revision ? a : b;
}

export function mergePreferenceEntries(a: PreferenceEntry | undefined, b: PreferenceEntry): PreferenceEntry {
  if (!a) return { ...b, confidence: Math.min(PERSONALIZATION_LIMITS.maxPreferenceConfidence, b.confidence) };
  if (a.value === b.value) {
    const selected = newer(a, b);
    return {
      ...selected,
      confidence: Math.min(PERSONALIZATION_LIMITS.maxPreferenceConfidence, Math.max(a.confidence, b.confidence) + 0.03),
      evidenceCount: Math.min(10000, a.evidenceCount + b.evidenceCount),
      firstSeenAt: (parseIso(a.firstSeenAt)?.getTime() ?? 0) <= (parseIso(b.firstSeenAt)?.getTime() ?? 0) ? a.firstSeenAt : b.firstSeenAt,
      revision: Math.max(a.revision, b.revision) + 1,
    };
  }
  return { ...newer(a, b), status: 'pending-review', confidence: Math.min(a.confidence, b.confidence), revision: Math.max(a.revision, b.revision) + 1 };
}

export function mergeProfiles(local: ProfileSnapshot, incoming: ProfileSnapshot, now = new Date()): ProfileSnapshot {
  const preferences: Partial<Record<PreferenceKey, PreferenceEntry>> = { ...local.preferences };
  for (const [rawKey, entry] of Object.entries(incoming.preferences)) {
    if (!entry) continue;
    const key = rawKey as PreferenceKey;
    preferences[key] = mergePreferenceEntries(preferences[key], entry);
  }
  const unique = (values: readonly string[]) => [...new Set(values)].slice(-100);
  return {
    ...local,
    updatedAt: now.toISOString(),
    preferences,
    dismissedProposalIds: unique([...local.dismissedProposalIds, ...incoming.dismissedProposalIds]),
    acceptedProposalIds: unique([...local.acceptedProposalIds, ...incoming.acceptedProposalIds]),
    // More restrictive local settings win on opt-in data collection.
    settings: {
      ...local.settings,
      personalizationEnabled: local.settings.personalizationEnabled && incoming.settings.personalizationEnabled,
      insightsEnabled: local.settings.insightsEnabled && incoming.settings.insightsEnabled,
      reflectionThemesEnabled: local.settings.reflectionThemesEnabled && incoming.settings.reflectionThemesEnabled,
      usageLearningEnabled: local.settings.usageLearningEnabled && incoming.settings.usageLearningEnabled,
      retentionDays: Math.min(local.settings.retentionDays, incoming.settings.retentionDays),
      language: local.settings.language,
    },
  };
}

export function preferenceValuesEqual(a: PreferenceValue, b: PreferenceValue): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((value, index) => value === b[index]);
  return a === b;
}
