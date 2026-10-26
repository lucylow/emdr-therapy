import type { PreferenceEntry, PreferenceKey, ProfileSnapshot } from '../core/types.ts';
import { mergePreferenceEntries } from './merge.ts';

export interface PreferenceConflict {
  readonly key: PreferenceKey;
  readonly local: PreferenceEntry;
  readonly incoming: PreferenceEntry;
  readonly defaultWinner: 'explicit' | 'latest' | 'review-required';
  readonly message: string;
}

export function findPreferenceConflicts(local: ProfileSnapshot, incoming: ProfileSnapshot): readonly PreferenceConflict[] {
  const conflicts: PreferenceConflict[] = [];
  for (const [rawKey, incomingEntry] of Object.entries(incoming.preferences)) {
    const key = rawKey as PreferenceKey;
    const localEntry = local.preferences[key];
    if (!localEntry || !incomingEntry || JSON.stringify(localEntry.value) === JSON.stringify(incomingEntry.value)) continue;
    if (localEntry.origin === 'explicit' && localEntry.status === 'active') {
      conflicts.push({ key, local: localEntry, incoming: incomingEntry, defaultWinner: 'explicit', message: 'Your current explicit choice takes priority.' });
    } else if (incomingEntry.origin === 'explicit' && incomingEntry.status === 'active') {
      conflicts.push({ key, local: localEntry, incoming: incomingEntry, defaultWinner: 'explicit', message: 'The imported explicit choice can be offered for confirmation.' });
    } else {
      conflicts.push({ key, local: localEntry, incoming: incomingEntry, defaultWinner: 'review-required', message: 'The values differ; review before selecting a value.' });
    }
  }
  return conflicts;
}

export function resolvePreferenceConflict(
  key: PreferenceKey,
  local: PreferenceEntry,
  incoming: PreferenceEntry,
  choice: 'keep-local' | 'use-incoming' | 'clear',
): PreferenceEntry | undefined {
  if (choice === 'clear') return undefined;
  if (choice === 'keep-local') return local;
  // Preserve an explicit local preference unless the user takes this explicit action.
  const merged = mergePreferenceEntries(local, incoming);
  return { ...merged, status: 'active', revision: Math.max(local.revision, incoming.revision) + 1 };
}
