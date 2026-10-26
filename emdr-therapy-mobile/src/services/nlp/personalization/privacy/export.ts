import type { LocalDataBundle, ProfileSnapshot } from '../core/types.ts';
import { isPlainObject } from '../core/validation.ts';
import { validateCheckIn, validateActivityFeedback } from '../core/validation.ts';
import { migrateProfile } from '../store/schema.ts';
import type { PersonalizationRepository } from '../store/contracts.ts';

export interface BundleValidation {
  readonly valid: boolean;
  readonly issues: readonly string[];
  readonly bundle?: LocalDataBundle;
}

export async function exportLocalData(repository: PersonalizationRepository): Promise<LocalDataBundle | undefined> {
  const bundle = await repository.exportBundle();
  if (!bundle) return undefined;
  // Reconstruct as a plain object with known fields only. Raw reflections are not a bundle field.
  return {
    format: 'emdr-flow-local-data', formatVersion: 1, exportedAt: new Date().toISOString(),
    profile: bundle.profile,
    checkIns: [...bundle.checkIns], activityFeedback: [...bundle.activityFeedback],
    themeCounts: bundle.themeCounts.map(({ themeId, count, source, day, updatedAt }) => ({ themeId, count, source, day, updatedAt })),
    events: bundle.events.map((event) => ({ eventId: event.eventId, createdAt: event.createdAt, category: event.category, code: event.code, attributes: { ...event.attributes } })),
  };
}

export function validateImportBundle(input: unknown): BundleValidation {
  const issues: string[] = [];
  if (!isPlainObject(input)) return { valid: false, issues: ['bundle-not-object'] };
  if (input.format !== 'emdr-flow-local-data') issues.push('unsupported-format');
  if (input.formatVersion !== 1) issues.push('unsupported-format-version');
  const migration = migrateProfile(input.profile);
  if (!migration.profile) issues.push(...migration.issues.map((issue) => `profile:${issue}`));
  if (!Array.isArray(input.checkIns) || input.checkIns.length > 730) issues.push('invalid-checkins');
  if (!Array.isArray(input.activityFeedback) || input.activityFeedback.length > 1000) issues.push('invalid-feedback');
  if (!Array.isArray(input.themeCounts) || input.themeCounts.length > 100) issues.push('invalid-theme-counts');
  if (!Array.isArray(input.events) || input.events.length > 500) issues.push('invalid-events');
  const checkIns = Array.isArray(input.checkIns) ? input.checkIns.map((record, i) => {
    const result = validateCheckIn(record);
    if (!result.value) issues.push(`checkIns[${i}]:invalid`);
    return result.value;
  }).filter((x) => x !== undefined) : [];
  const feedback = Array.isArray(input.activityFeedback) ? input.activityFeedback.map((record, i) => {
    const result = validateActivityFeedback(record);
    if (!result.value) issues.push(`activityFeedback[${i}]:invalid`);
    return result.value;
  }).filter((x) => x !== undefined) : [];
  const profile = migration.profile as ProfileSnapshot | undefined;
  if (issues.length || !profile) return { valid: false, issues };

  const rawThemeCounts: unknown[] = Array.isArray(input.themeCounts) ? input.themeCounts : [];
  const rawEvents: unknown[] = Array.isArray(input.events) ? input.events : [];
  const themeCounts = rawThemeCounts.flatMap((value: unknown, i: number) => {
    if (!isPlainObject(value) || typeof value.themeId !== 'string' || !Number.isInteger(value.count) || Number(value.count) < 0 || Number(value.count) > 10000 || (value.source !== 'user-selected-tag' && value.source !== 'opt-in-reflection-extraction')) {
      issues.push(`themeCounts[${i}]:invalid`); return [];
    }
    if (value.day !== undefined && (typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day))) { issues.push(`themeCounts[${i}]:invalid-day`); return []; }
    if (value.updatedAt !== undefined && (typeof value.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.updatedAt))) { issues.push(`themeCounts[${i}]:invalid-updatedAt`); return []; }
    return [{ themeId: value.themeId as LocalDataBundle['themeCounts'][number]['themeId'], count: Number(value.count), source: value.source as LocalDataBundle['themeCounts'][number]['source'], day: value.day as string | undefined, updatedAt: value.updatedAt as string | undefined }];
  });
  const events = rawEvents.flatMap((value: unknown, i: number) => {
    if (!isPlainObject(value) || typeof value.eventId !== 'string' || typeof value.createdAt !== 'string' || typeof value.code !== 'string' || !isPlainObject(value.attributes)) {
      issues.push(`events[${i}]:invalid`); return [];
    }
    const categories = ['preference-confirmed', 'preference-cleared', 'proposal-dismissed', 'insight-opened', 'insight-dismissed', 'recommendation-shown', 'recommendation-selected', 'data-exported', 'history-cleared', 'consent-changed'];
    if (!categories.includes(String(value.category))) { issues.push(`events[${i}]:invalid-category`); return []; }
    return [{ eventId: value.eventId, createdAt: value.createdAt, code: value.code,
      category: value.category as LocalDataBundle['events'][number]['category'], attributes: value.attributes as LocalDataBundle['events'][number]['attributes'] }];
  });
  if (issues.length) return { valid: false, issues };
  const bundle: LocalDataBundle = { format: 'emdr-flow-local-data', formatVersion: 1,
    exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date().toISOString(),
    profile, checkIns, activityFeedback: feedback, themeCounts, events };
  return { valid: true, issues: [], bundle };
}

export async function importLocalData(repository: PersonalizationRepository, input: unknown, mode: 'merge' | 'replace'): Promise<BundleValidation> {
  const result = validateImportBundle(input);
  if (!result.valid || !result.bundle) return result;
  const bundle = result.bundle;
  if (mode === 'replace') {
    await repository.deleteAll();
    await repository.writeProfile(bundle.profile);
    await repository.replaceCheckIns(bundle.checkIns);
    await repository.replaceActivityFeedback(bundle.activityFeedback);
    await repository.writeThemeCounts(bundle.themeCounts);
    await repository.replaceEvents(bundle.events);
    return result;
  }
  const existingProfile = await repository.readProfile();
  const mergedProfile = existingProfile ? {
    ...existingProfile,
    // Import never silently enables collection that was disabled locally.
    settings: {
      ...existingProfile.settings,
      personalizationEnabled: existingProfile.settings.personalizationEnabled && bundle.profile.settings.personalizationEnabled,
      insightsEnabled: existingProfile.settings.insightsEnabled && bundle.profile.settings.insightsEnabled,
      reflectionThemesEnabled: existingProfile.settings.reflectionThemesEnabled && bundle.profile.settings.reflectionThemesEnabled,
      usageLearningEnabled: existingProfile.settings.usageLearningEnabled && bundle.profile.settings.usageLearningEnabled,
    },
  } : bundle.profile;
  await repository.writeProfile(mergedProfile);
  await repository.replaceCheckIns([...await repository.listCheckIns(), ...bundle.checkIns].slice(-730));
  await repository.replaceActivityFeedback([...await repository.listActivityFeedback(), ...bundle.activityFeedback].slice(-1000));
  await repository.writeThemeCounts([...await repository.listThemeCounts(), ...bundle.themeCounts].slice(-100));
  await repository.replaceEvents([...await repository.listEvents(), ...bundle.events].slice(-500));
  return result;
}
