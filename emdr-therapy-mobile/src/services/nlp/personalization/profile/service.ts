import { DEFAULT_PROFILE_SETTINGS, PERSONALIZATION_LIMITS, normalizeSettings } from '../core/config.ts';
import { createId } from '../core/id.ts';
import { toIso, type Clock, systemClock } from '../core/time.ts';
import { isPreferenceKey, isSafeIdentifier, validatePreferenceValue } from '../core/validation.ts';
import type { PreferenceEntry, PreferenceKey, PreferenceProposal, ProfileSnapshot, ProfileSettings, PreferenceValue } from '../core/types.ts';
import type { PersonalizationRepository } from '../store/contracts.ts';
import { createDefaultProfile } from './defaults.ts';
import { proposalIsExpired, appendBoundedId } from './review.ts';

export interface ProfileServiceOptions {
  readonly profileId: string;
  readonly repository: PersonalizationRepository;
  readonly clock?: Clock;
}

export class ProfileService {
  private readonly options: ProfileServiceOptions;
  private readonly clock: Clock;
  constructor(options: ProfileServiceOptions) {
    this.options = options;
    if (!isSafeIdentifier(options.profileId)) throw new Error('Invalid local profile identifier');
    this.clock = options.clock ?? systemClock;
  }

  async getOrCreate(): Promise<ProfileSnapshot> {
    const existing = await this.options.repository.readProfile();
    if (existing) return existing;
    const created = createDefaultProfile(this.options.profileId, this.clock.now());
    await this.options.repository.writeProfile(created);
    return created;
  }

  async updateSettings(changes: Partial<ProfileSettings>): Promise<ProfileSnapshot> {
    const profile = await this.getOrCreate();
    const next: ProfileSnapshot = { ...profile, updatedAt: toIso(this.clock.now()), settings: normalizeSettings({ ...profile.settings, ...changes }) };
    await this.options.repository.writeProfile(next);
    return next;
  }

  async setExplicitPreference(key: PreferenceKey, value: PreferenceValue): Promise<ProfileSnapshot> {
    if (!isPreferenceKey(key) || !validatePreferenceValue(key, value)) throw new Error('Invalid preference value');
    const profile = await this.getOrCreate();
    const now = toIso(this.clock.now());
    const previous = profile.preferences[key];
    const entry: PreferenceEntry = {
      key, value: Array.isArray(value) ? [...value] : value,
      origin: 'explicit', status: 'active', confidence: 1,
      evidenceCount: Math.max(1, previous?.evidenceCount ?? 0),
      firstSeenAt: previous?.firstSeenAt ?? now, lastSeenAt: now, userConfirmedAt: now,
      explanationCode: 'set-explicitly-by-user', revision: (previous?.revision ?? 0) + 1,
    };
    const next = { ...profile, updatedAt: now, preferences: { ...profile.preferences, [key]: entry } };
    await this.options.repository.writeProfile(next);
    return next;
  }

  async confirmProposal(proposal: PreferenceProposal): Promise<ProfileSnapshot> {
    if (proposalIsExpired(proposal, this.clock.now())) throw new Error('Proposal expired');
    if (!proposal.requiresConfirmation || !validatePreferenceValue(proposal.key, proposal.proposedValue)) throw new Error('Invalid proposal');
    const profile = await this.getOrCreate();
    const now = toIso(this.clock.now());
    const old = profile.preferences[proposal.key];
    if (old?.origin === 'explicit' && old.status === 'active') throw new Error('Explicit preference must be changed by the user');
    if (!Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1 || !Number.isInteger(proposal.evidenceCount) || proposal.evidenceCount < 0) throw new Error('Invalid proposal confidence or evidence');
    const entry: PreferenceEntry = {
      key: proposal.key, value: Array.isArray(proposal.proposedValue) ? [...proposal.proposedValue] : proposal.proposedValue,
      origin: 'accepted-suggestion', status: 'active', confidence: Math.min(PERSONALIZATION_LIMITS.maxPreferenceConfidence, proposal.confidence),
      evidenceCount: proposal.evidenceCount, firstSeenAt: old?.firstSeenAt ?? proposal.createdAt,
      lastSeenAt: now, userConfirmedAt: now, explanationCode: proposal.explanationCode, revision: (old?.revision ?? 0) + 1,
    };
    const next: ProfileSnapshot = {
      ...profile, updatedAt: now,
      preferences: { ...profile.preferences, [proposal.key]: entry },
      acceptedProposalIds: appendBoundedId(profile.acceptedProposalIds, proposal.id),
    };
    await this.options.repository.writeProfile(next);
    return next;
  }

  async dismissProposal(proposalId: string): Promise<ProfileSnapshot> {
    if (!isSafeIdentifier(proposalId)) throw new Error('Invalid proposal identifier');
    const profile = await this.getOrCreate();
    const next: ProfileSnapshot = { ...profile, updatedAt: toIso(this.clock.now()), dismissedProposalIds: appendBoundedId(profile.dismissedProposalIds, proposalId) };
    await this.options.repository.writeProfile(next);
    return next;
  }

  async clearPreference(key: PreferenceKey): Promise<ProfileSnapshot> {
    const profile = await this.getOrCreate();
    const old = profile.preferences[key];
    if (!old) return profile;
    const next: ProfileSnapshot = {
      ...profile, updatedAt: toIso(this.clock.now()),
      preferences: { ...profile.preferences, [key]: { ...old, status: 'cleared', revision: old.revision + 1, lastSeenAt: toIso(this.clock.now()) } },
    };
    await this.options.repository.writeProfile(next);
    return next;
  }

  async clearAllPreferences(): Promise<ProfileSnapshot> {
    const profile = await this.getOrCreate();
    const next: ProfileSnapshot = {
      ...profile, updatedAt: toIso(this.clock.now()), preferences: {},
      dismissedProposalIds: [], acceptedProposalIds: [],
      settings: { ...DEFAULT_PROFILE_SETTINGS, language: profile.settings.language },
    };
    await this.options.repository.writeProfile(next);
    return next;
  }

  async getPreference(key: PreferenceKey): Promise<PreferenceEntry | undefined> {
    const profile = await this.getOrCreate();
    const value = profile.preferences[key];
    return value?.status === 'active' ? value : undefined;
  }
}
