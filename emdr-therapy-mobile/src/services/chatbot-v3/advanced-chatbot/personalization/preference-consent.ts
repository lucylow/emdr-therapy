import type { Locale, UserPreferences } from '../types.ts';
export type PreferenceSource = 'explicit' | 'accepted-inference';
export type SafePreferenceKey = 'locale' | 'tone' | 'reducedMotion' | 'audioEnabled' | 'confirmedFeatures';
export type PreferenceEntry = { key: SafePreferenceKey; value: string | boolean | string[]; source: PreferenceSource; updatedAt: number };
export type PreferenceUpdateResult = { accepted: boolean; reason: 'saved' | 'consent-required' | 'sensitive-key' | 'invalid-key' | 'invalid-value' | 'inference-needs-review' | 'not-accepted'; entry?: PreferenceEntry };
const SAFE_KEYS = new Set<string>(['locale','tone','reducedMotion','audioEnabled','confirmedFeatures']);
const BLOCKED = /(?:trauma|diagnos|ptsd|depress|anxiety|medication|meds|suicid|self.?harm|abuse|memory|symptom|trigger|treatment|health|therapyHistory)/i;
const FEATURE = /^[a-z0-9][a-z0-9_-]{0,48}$/i;

/** Only low-risk UI preferences are retained. Clinical/sensitive inferences are rejected. */
export class ConsentGatedPreferences {
  private readonly entries = new Map<SafePreferenceKey, PreferenceEntry>();
  private consent = false;
  private maxEntries: number;
  constructor(options: { maxEntries?: number } = {}) { this.maxEntries = Math.min(5, Math.max(1, Math.floor(options.maxEntries ?? 5))); }
  grantConsent(): void { this.consent = true; }
  hasConsent(): boolean { return this.consent; }
  update(key: string, value: unknown, source: PreferenceSource, now = Date.now(), userAcceptedInference = false): PreferenceUpdateResult {
    if (source !== 'explicit' && source !== 'accepted-inference') return { accepted: false, reason: 'invalid-value' };
    if (BLOCKED.test(key)) return { accepted: false, reason: 'sensitive-key' };
    if (!SAFE_KEYS.has(key)) return { accepted: false, reason: 'invalid-key' };
    if (!this.consent) return { accepted: false, reason: 'consent-required' };
    if (source === 'accepted-inference' && !userAcceptedInference) return { accepted: false, reason: 'inference-needs-review' };
    if (!validatePreference(key, value)) return { accepted: false, reason: 'invalid-value' };
    const entry: PreferenceEntry = { key: key as SafePreferenceKey, value: cloneValue(value), source, updatedAt: now };
    this.entries.set(entry.key, entry);
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value as SafePreferenceKey);
    return { accepted: true, reason: 'saved', entry: cloneEntry(entry) };
  }
  get(key: SafePreferenceKey): PreferenceEntry | undefined { const row = this.entries.get(key); return row ? cloneEntry(row) : undefined; }
  list(): PreferenceEntry[] { return [...this.entries.values()].map(cloneEntry); }
  asUserPreferences(): UserPreferences {
    const result: UserPreferences = {};
    for (const [key, entry] of this.entries) {
      if (key === 'locale' && isLocale(entry.value)) result.locale = entry.value;
      else if (key === 'tone' && isTone(entry.value)) result.tone = entry.value;
      else if (key === 'reducedMotion' && typeof entry.value === 'boolean') result.reducedMotion = entry.value;
      else if (key === 'audioEnabled' && typeof entry.value === 'boolean') result.audioEnabled = entry.value;
      else if (key === 'confirmedFeatures' && Array.isArray(entry.value)) result.confirmedFeatures = [...entry.value];
    }
    return result;
  }
  revokeConsent(): void { this.consent = false; this.entries.clear(); }
  clear(): void { this.entries.clear(); }
  import(value: unknown): { accepted: number; rejected: number } {
    if (!this.consent || !Array.isArray(value) || value.length > this.maxEntries) return { accepted: 0, rejected: Array.isArray(value) ? value.length : 1 };
    let accepted = 0, rejected = 0;
    for (const item of value) {
      if (!item || typeof item !== 'object') { rejected++; continue; }
      const row = item as Record<string, unknown>; const result = this.update(String(row.key ?? ''), row.value, row.source === 'accepted-inference' ? 'accepted-inference' : 'explicit', typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(), false);
      if (result.accepted) accepted++; else rejected++;
    }
    return { accepted, rejected };
  }
}
function validatePreference(key: string, value: unknown): boolean {
  if (key === 'locale') return isLocale(value);
  if (key === 'tone') return isTone(value);
  if (key === 'reducedMotion' || key === 'audioEnabled') return typeof value === 'boolean';
  return key === 'confirmedFeatures' && Array.isArray(value) && value.length <= 30 && value.every(v => typeof v === 'string' && FEATURE.test(v));
}
function cloneValue(value: unknown): string | boolean | string[] { return Array.isArray(value) ? value.slice() as string[] : value as string | boolean; }
function cloneEntry(value: PreferenceEntry): PreferenceEntry { return { ...value, value: cloneValue(value.value) }; }
function isLocale(value: unknown): value is Locale { return value === 'en' || value === 'fr' || value === 'es'; }
function isTone(value: unknown): value is 'warm' | 'neutral' | 'concise' { return value === 'warm' || value === 'neutral' || value === 'concise'; }
