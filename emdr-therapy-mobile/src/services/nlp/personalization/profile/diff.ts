import type { PreferenceEntry, PreferenceKey, ProfileSnapshot } from '../core/types.ts';

export interface ProfileChange {
  readonly key: PreferenceKey;
  readonly kind: 'added' | 'updated' | 'removed' | 'conflict';
  readonly before?: PreferenceEntry;
  readonly after?: PreferenceEntry;
  readonly explanation: string;
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') return JSON.stringify(value, Object.keys(value as object).sort());
  return String(value);
}

export function diffProfiles(before: ProfileSnapshot, after: ProfileSnapshot): readonly ProfileChange[] {
  const keys = [...new Set([...Object.keys(before.preferences), ...Object.keys(after.preferences)])] as PreferenceKey[];
  const changes: ProfileChange[] = [];
  for (const key of keys) {
    const left = before.preferences[key];
    const right = after.preferences[key];
    if (!left && right) changes.push({ key, kind: 'added', after: right, explanation: 'A preference was added.' });
    else if (left && !right) changes.push({ key, kind: 'removed', before: left, explanation: 'A preference was cleared.' });
    else if (left && right && stableValue(left.value) !== stableValue(right.value)) {
      const conflict = right.status === 'pending-review';
      changes.push({ key, kind: conflict ? 'conflict' : 'updated', before: left, after: right,
        explanation: conflict ? 'Two different values were found; the user needs to choose.' : 'The preference value changed.' });
    }
  }
  return changes;
}

export function activePreferences(profile: ProfileSnapshot): readonly PreferenceEntry[] {
  return Object.values(profile.preferences).filter((entry): entry is PreferenceEntry => !!entry && entry.status === 'active');
}

export function activeExplicitPreference(profile: ProfileSnapshot, key: PreferenceKey): PreferenceEntry | undefined {
  const entry = profile.preferences[key];
  return entry?.origin === 'explicit' && entry.status === 'active' ? entry : undefined;
}
