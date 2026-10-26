import { PERSONALIZATION_LIMITS } from './config.ts';
import { parseIso } from './time.ts';
import type {
  ActivityFeedbackRecord, CheckInRecord, Identifier, LanguageCode, PreferenceKey,
  PreferenceValue, SupportToolId, ThemeId,
} from './types.ts';

const THEMES = new Set<ThemeId>([
  'daily-routines', 'sleep-and-energy', 'relationships-and-connection', 'work-and-demands',
  'uncertainty-and-change', 'self-compassion', 'body-and-senses', 'nature-and-outdoors',
  'creative-activities', 'movement-and-rest', 'other',
]);
const ACTIVITIES = new Set<SupportToolId>([
  'grounding-5-4-3-2-1', 'paced-breathing', 'orientation-to-room', 'gentle-stretch',
  'quiet-pause', 'sensory-preferences', 'short-reflection', 'kind-self-talk',
  'water-break', 'contact-support', 'none',
]);
const PREFERENCE_KEYS = new Set<PreferenceKey>([
  'language', 'responseLength', 'tone', 'visualTheme', 'reducedMotion', 'soundEnabled',
  'hapticsEnabled', 'captionsEnabled', 'fontScale', 'suggestionDensity', 'preferredSupportTools',
]);
const KNOWN_SCALARS = new Set(['true', 'false']);

export interface ValidationIssue {
  readonly code: string;
  readonly path: string;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function isSafeIdentifier(value: unknown): value is Identifier {
  return typeof value === 'string' && value.length >= 1 && value.length <= 96
    && /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value);
}

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === 'en' || value === 'fr' || value === 'es';
}

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.has(value as ThemeId);
}

export function isSupportToolId(value: unknown): value is SupportToolId {
  return typeof value === 'string' && ACTIVITIES.has(value as SupportToolId);
}

export function isPreferenceKey(value: unknown): value is PreferenceKey {
  return typeof value === 'string' && PREFERENCE_KEYS.has(value as PreferenceKey);
}

export function validatePreferenceValue(key: PreferenceKey, value: unknown): value is PreferenceValue {
  switch (key) {
    case 'language': return isLanguageCode(value);
    case 'responseLength': return value === 'short' || value === 'balanced' || value === 'detailed';
    case 'tone': return value === 'warm' || value === 'neutral' || value === 'direct';
    case 'visualTheme': return value === 'mist' || value === 'forest' || value === 'night' || value === 'high-contrast';
    case 'reducedMotion':
    case 'soundEnabled':
    case 'hapticsEnabled':
    case 'captionsEnabled': return typeof value === 'boolean' || (typeof value === 'string' && KNOWN_SCALARS.has(value));
    case 'fontScale': return typeof value === 'number' && Number.isFinite(value) && value >= 0.85 && value <= 1.8;
    case 'suggestionDensity': return value === 'few' || value === 'standard' || value === 'many';
    case 'preferredSupportTools': return Array.isArray(value) && value.length <= 8 && value.every(isSupportToolId);
  }
}

export function validateCheckIn(input: unknown): { value?: CheckInRecord; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(input)) return { issues: [{ code: 'expected-object', path: '$' }] };
  const r = input;
  if (!isSafeIdentifier(r.id)) issues.push({ code: 'invalid-id', path: 'id' });
  if (typeof r.createdAt !== 'string' || !parseIso(r.createdAt)) issues.push({ code: 'invalid-date', path: 'createdAt' });
  if (r.phase !== 'before' && r.phase !== 'after' && r.phase !== 'standalone') issues.push({ code: 'invalid-phase', path: 'phase' });
  if (r.settlednessRating !== undefined && (!Number.isInteger(r.settlednessRating) || Number(r.settlednessRating) < 0 || Number(r.settlednessRating) > 10)) {
    issues.push({ code: 'rating-out-of-range', path: 'settlednessRating' });
  }
  if (r.helpfulnessRating !== undefined && (!Number.isInteger(r.helpfulnessRating) || Number(r.helpfulnessRating) < 1 || Number(r.helpfulnessRating) > 5)) {
    issues.push({ code: 'rating-out-of-range', path: 'helpfulnessRating' });
  }
  if (r.activityId !== undefined && !isSupportToolId(r.activityId)) issues.push({ code: 'invalid-activity', path: 'activityId' });
  if (r.sessionGroupId !== undefined && !isSafeIdentifier(r.sessionGroupId)) issues.push({ code: 'invalid-session-group', path: 'sessionGroupId' });
  if (!Array.isArray(r.selectedThemes) || r.selectedThemes.length > PERSONALIZATION_LIMITS.maxThemesPerReflection || !r.selectedThemes.every(isThemeId)) {
    issues.push({ code: 'invalid-themes', path: 'selectedThemes' });
  }
  if (typeof r.aggregateConsent !== 'boolean') issues.push({ code: 'invalid-consent-flag', path: 'aggregateConsent' });
  if (issues.length) return { issues };
  return { value: {
    id: r.id as string,
    createdAt: new Date(String(r.createdAt)).toISOString(),
    phase: r.phase as CheckInRecord['phase'],
    settlednessRating: r.settlednessRating as number | undefined,
    helpfulnessRating: r.helpfulnessRating as number | undefined,
    activityId: r.activityId as SupportToolId | undefined,
    sessionGroupId: r.sessionGroupId as string | undefined,
    selectedThemes: [...new Set(r.selectedThemes as ThemeId[])],
    aggregateConsent: r.aggregateConsent as boolean,
  }, issues };
}

export function validateActivityFeedback(input: unknown): { value?: ActivityFeedbackRecord; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(input)) return { issues: [{ code: 'expected-object', path: '$' }] };
  const r = input;
  if (!isSafeIdentifier(r.id)) issues.push({ code: 'invalid-id', path: 'id' });
  if (typeof r.createdAt !== 'string' || !parseIso(r.createdAt)) issues.push({ code: 'invalid-date', path: 'createdAt' });
  if (!isSupportToolId(r.activityId) || r.activityId === 'none') issues.push({ code: 'invalid-activity', path: 'activityId' });
  if (![1, 2, 3, 4, 5].includes(Number(r.helpfulness))) issues.push({ code: 'invalid-helpfulness', path: 'helpfulness' });
  if (r.skipped !== undefined && typeof r.skipped !== 'boolean') issues.push({ code: 'invalid-skip', path: 'skipped' });
  if (r.source !== 'explicit-rating' && r.source !== 'explicit-skip') issues.push({ code: 'invalid-source', path: 'source' });
  if (issues.length) return { issues };
  return { value: {
    id: String(r.id), createdAt: new Date(String(r.createdAt)).toISOString(),
    activityId: r.activityId as SupportToolId, helpfulness: Number(r.helpfulness) as 1 | 2 | 3 | 4 | 5,
    skipped: r.skipped as boolean | undefined, source: r.source as ActivityFeedbackRecord['source'],
  }, issues };
}

export function finiteInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

export function validateBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length <= maxLength && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}

export function validateRecordCount(value: unknown, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maximum;
}

export function validateConsentState(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return ['personalization', 'aggregateInsights', 'reflectionThemeExtraction', 'usageLearning'].every((k) => typeof value[k] === 'boolean')
    && typeof value.updatedAt === 'string' && parseIso(value.updatedAt) !== undefined;
}
