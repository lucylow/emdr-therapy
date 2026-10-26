import type { ChatProfile } from '../types.ts';
import type { Language } from '../../types.ts';

export interface ProfileUpdateRequest { profile: ChatProfile; userConfirmed: boolean; }

/** Stores only explicit, user-confirmed preferences. Inferred signals are intentionally not accepted. */
export class ConfirmedChatProfile {
  private value: ChatProfile = {};
  read(): ChatProfile { return clone(this.value); }
  update(request: ProfileUpdateRequest): ChatProfile {
    if (request.userConfirmed !== true) return this.read();
    const next = validateProfile(request.profile);
    this.value = { ...this.value, ...next, updatedAt: Date.now() };
    return this.read();
  }
  clear(): void { this.value = {}; }
  hasPreferences(): boolean { return Object.keys(this.value).length > 0; }
}

export function validateProfile(profile: ChatProfile): ChatProfile {
  const output: ChatProfile = {};
  if (profile.tone === 'gentle' || profile.tone === 'direct' || profile.tone === 'neutral') output.tone = profile.tone;
  if (profile.responseLength === 'brief' || profile.responseLength === 'balanced' || profile.responseLength === 'detailed') output.responseLength = profile.responseLength;
  if (profile.language === 'en' || profile.language === 'fr' || profile.language === 'es') output.language = profile.language as Exclude<Language, 'unknown'>;
  if (Array.isArray(profile.preferredTools)) {
    const valid = profile.preferredTools.filter((item) => ['grounding', 'breathing', 'reflection', 'app_help'].includes(item));
    output.preferredTools = [...new Set(valid)].slice(0, 4);
  }
  if (profile.updatedAt !== undefined && Number.isFinite(profile.updatedAt)) output.updatedAt = Math.max(0, Math.min(Date.now() + 1000, profile.updatedAt));
  return output;
}
function clone(profile: ChatProfile): ChatProfile { return { ...profile, preferredTools: profile.preferredTools ? [...profile.preferredTools] : undefined }; }
