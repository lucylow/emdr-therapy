import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import { parseIso } from '../core/time.ts';
import type { PreferenceEntry, PreferenceProposal, ProfileSnapshot } from '../core/types.ts';

export function proposalIsExpired(proposal: PreferenceProposal, now = new Date()): boolean {
  const expiry = parseIso(proposal.expiresAt);
  return !expiry || expiry.getTime() <= now.getTime();
}

export function createPreferenceProposal(input: Omit<PreferenceProposal, 'requiresConfirmation' | 'expiresAt'> & { expiresAt?: string }, now = new Date()): PreferenceProposal {
  const expiresAt = input.expiresAt ?? new Date(now.getTime() + PERSONALIZATION_LIMITS.maxProposalLifetimeDays * 86_400_000).toISOString();
  return { ...input, createdAt: input.createdAt, expiresAt, requiresConfirmation: true };
}

export function currentPreference(profile: ProfileSnapshot, key: PreferenceEntry['key']): PreferenceEntry | undefined {
  const entry = profile.preferences[key];
  return entry?.status === 'active' ? entry : undefined;
}

export function shouldSurfaceProposal(proposal: PreferenceProposal, profile: ProfileSnapshot, now = new Date()): boolean {
  if (proposalIsExpired(proposal, now)) return false;
  if (profile.dismissedProposalIds.includes(proposal.id) || profile.acceptedProposalIds.includes(proposal.id)) return false;
  const existing = profile.preferences[proposal.key];
  if (existing?.origin === 'explicit' && existing.status === 'active') return false;
  return proposal.confidence >= PERSONALIZATION_LIMITS.minPreferenceConfidence;
}

export function appendBoundedId(values: readonly string[], id: string, maximum = 100): readonly string[] {
  return [...new Set([...values, id])].slice(-maximum);
}
