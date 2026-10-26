import type { LanguageCode, PreferenceEntry, PreferenceKey, ProfileSnapshot } from '../core/types.ts';

export interface ResponseStyle {
  readonly language: LanguageCode;
  readonly responseLength: 'short' | 'balanced' | 'detailed';
  readonly tone: 'warm' | 'neutral' | 'direct';
  readonly suggestionDensity: 'few' | 'standard' | 'many';
  readonly fontScale: number;
  readonly reducedMotion: boolean;
  readonly captionsEnabled: boolean;
}

function read<T>(profile: ProfileSnapshot, key: PreferenceKey, fallback: T): T {
  const preference = profile.preferences[key];
  if (!preference || preference.status !== 'active') return fallback;
  return preference.value as T;
}

/** Adapts presentation and generic support wording only; it must never rewrite safety decisions. */
export function buildResponseStyle(profile: ProfileSnapshot): ResponseStyle {
  return {
    language: read(profile, 'language', profile.settings.language),
    responseLength: read(profile, 'responseLength', 'balanced'),
    tone: read(profile, 'tone', 'warm'),
    suggestionDensity: read(profile, 'suggestionDensity', 'few'),
    fontScale: read(profile, 'fontScale', 1),
    reducedMotion: read(profile, 'reducedMotion', false),
    captionsEnabled: read(profile, 'captionsEnabled', true),
  };
}

export function truncateForStyle(text: string, style: ResponseStyle, maxCharacters = 4000): string {
  const safeMax = Math.max(120, Math.min(10_000, Math.floor(maxCharacters)));
  const content = String(text ?? '').slice(0, safeMax);
  if (style.responseLength === 'detailed' || content.length <= 340) return content;
  const target = style.responseLength === 'short' ? 180 : 420;
  if (content.length <= target) return content;
  const split = content.lastIndexOf(' ', target);
  return `${content.slice(0, split > target * 0.65 ? split : target).trimEnd()}…`;
}

export function safeSuggestionLimit(style: ResponseStyle, userRequested: boolean): number {
  if (!userRequested) return 0;
  if (style.suggestionDensity === 'few') return 1;
  if (style.suggestionDensity === 'many') return 3;
  return 2;
}

export function preferencesThatAffectPresentation(profile: ProfileSnapshot): readonly PreferenceKey[] {
  const allowed: PreferenceKey[] = ['language', 'responseLength', 'tone', 'visualTheme', 'reducedMotion', 'soundEnabled', 'hapticsEnabled', 'captionsEnabled', 'fontScale', 'suggestionDensity'];
  return allowed.filter((key) => profile.preferences[key]?.status === 'active');
}

export function styleSettingChangeAllowed(key: PreferenceKey): boolean {
  return key !== 'preferredSupportTools';
}
