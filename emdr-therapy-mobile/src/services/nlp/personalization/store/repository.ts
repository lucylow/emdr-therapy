import type {
  ActivityFeedbackRecord, CheckInRecord, LocalDataBundle, PersonalizationEvent,
  ProfileSnapshot, ThemeCount,
} from '../core/types.ts';
import { createNamespace, type KeyValueStore, type PersonalizationRepository } from './contracts.ts';
import { InMemoryMutex } from './memory-store.ts';

const KEY = {
  profile: 'profile', checkIns: 'check-ins', feedback: 'activity-feedback',
  themes: 'theme-counts', events: 'events',
} as const;

/**
 * Repository uses separate keys to permit bounded writes. It is not a clinical record system.
 * The host should place it behind an encrypted local store and test app-uninstall semantics.
 */
export class LocalPersonalizationRepository implements PersonalizationRepository {
  private readonly store: KeyValueStore;
  private readonly ns;
  private readonly mutex = new InMemoryMutex();
  constructor(store: KeyValueStore, prefix = 'emdr-personalization-v1') {
    this.store = store;
    this.ns = createNamespace(prefix);
  }
  readProfile(): Promise<ProfileSnapshot | undefined> { return this.store.get(this.ns.key(KEY.profile)); }
  writeProfile(profile: ProfileSnapshot): Promise<void> { return this.store.set(this.ns.key(KEY.profile), profile); }
  async listCheckIns(): Promise<readonly CheckInRecord[]> { return (await this.store.get<CheckInRecord[]>(this.ns.key(KEY.checkIns))) ?? []; }
  async appendCheckIn(record: CheckInRecord): Promise<void> {
    await this.mutex.run(async () => {
      const records = [...await this.listCheckIns(), record];
      await this.store.set(this.ns.key(KEY.checkIns), records.slice(-730));
    });
  }
  replaceCheckIns(records: readonly CheckInRecord[]): Promise<void> { return this.store.set(this.ns.key(KEY.checkIns), [...records].slice(-730)); }
  async listActivityFeedback(): Promise<readonly ActivityFeedbackRecord[]> { return (await this.store.get<ActivityFeedbackRecord[]>(this.ns.key(KEY.feedback))) ?? []; }
  async appendActivityFeedback(record: ActivityFeedbackRecord): Promise<void> {
    await this.mutex.run(async () => {
      const records = [...await this.listActivityFeedback(), record];
      await this.store.set(this.ns.key(KEY.feedback), records.slice(-1000));
    });
  }
  replaceActivityFeedback(records: readonly ActivityFeedbackRecord[]): Promise<void> { return this.store.set(this.ns.key(KEY.feedback), [...records].slice(-1000)); }
  async listThemeCounts(): Promise<readonly ThemeCount[]> { return (await this.store.get<ThemeCount[]>(this.ns.key(KEY.themes))) ?? []; }
  writeThemeCounts(records: readonly ThemeCount[]): Promise<void> { return this.store.set(this.ns.key(KEY.themes), [...records].slice(0, 1000)); }
  async listEvents(): Promise<readonly PersonalizationEvent[]> { return (await this.store.get<PersonalizationEvent[]>(this.ns.key(KEY.events))) ?? []; }
  async appendEvent(event: PersonalizationEvent): Promise<void> {
    await this.mutex.run(async () => {
      const events = [...await this.listEvents(), event];
      await this.store.set(this.ns.key(KEY.events), events.slice(-500));
    });
  }
  replaceEvents(records: readonly PersonalizationEvent[]): Promise<void> { return this.store.set(this.ns.key(KEY.events), [...records].slice(-500)); }
  async exportBundle(): Promise<LocalDataBundle | undefined> {
    const [profile, checkIns, activityFeedback, themeCounts, events] = await Promise.all([
      this.readProfile(), this.listCheckIns(), this.listActivityFeedback(), this.listThemeCounts(), this.listEvents(),
    ]);
    if (!profile) return undefined;
    return { format: 'emdr-flow-local-data', formatVersion: 1, exportedAt: new Date().toISOString(),
      profile, checkIns, activityFeedback, themeCounts, events };
  }
  async deleteAll(): Promise<void> { await this.store.clear(`${this.ns.prefix}`); }
}
