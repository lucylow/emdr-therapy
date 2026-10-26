import type { LocalDataBundle, PersonalizationEvent, ProfileSnapshot, CheckInRecord, ActivityFeedbackRecord, ThemeCount } from '../core/types.ts';

/** A narrow key/value store interface; the host chooses SecureStore or an encrypted DB. */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  keys(prefix?: string): Promise<readonly string[]>;
  clear(prefix?: string): Promise<void>;
}

/** All operations are local by contract. Do not implement this interface with telemetry/network calls. */
export interface PersonalizationRepository {
  readProfile(): Promise<ProfileSnapshot | undefined>;
  writeProfile(profile: ProfileSnapshot): Promise<void>;
  listCheckIns(): Promise<readonly CheckInRecord[]>;
  appendCheckIn(record: CheckInRecord): Promise<void>;
  replaceCheckIns(records: readonly CheckInRecord[]): Promise<void>;
  listActivityFeedback(): Promise<readonly ActivityFeedbackRecord[]>;
  appendActivityFeedback(record: ActivityFeedbackRecord): Promise<void>;
  replaceActivityFeedback(records: readonly ActivityFeedbackRecord[]): Promise<void>;
  listThemeCounts(): Promise<readonly ThemeCount[]>;
  writeThemeCounts(records: readonly ThemeCount[]): Promise<void>;
  listEvents(): Promise<readonly PersonalizationEvent[]>;
  appendEvent(event: PersonalizationEvent): Promise<void>;
  replaceEvents(records: readonly PersonalizationEvent[]): Promise<void>;
  exportBundle(): Promise<LocalDataBundle | undefined>;
  deleteAll(): Promise<void>;
}

export interface Codec {
  encode(plainText: string): Promise<string>;
  decode(envelope: string): Promise<string>;
}

export interface KeyValueNamespace {
  readonly prefix: string;
  key(name: string): string;
}

export function createNamespace(prefix: string): KeyValueNamespace {
  const normalized = prefix.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 48);
  if (!normalized) throw new Error('A non-empty storage namespace is required');
  return { prefix: `${normalized}:`, key: (name) => `${normalized}:${name.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 80)}` };
}
