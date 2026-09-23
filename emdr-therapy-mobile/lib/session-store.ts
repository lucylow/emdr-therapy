import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SubscriptionTier } from "./monetization";
import type { SessionTelemetry, TelemetryEvent } from "./telemetry";

export type BlsMode = "visual" | "audio" | "haptic" | "mixed";
export type SessionSummary = {
  id: string;
  createdAt: string;
  durationMinutes: number;
  mode: BlsMode;
  initialSud: number;
  finalSud: number;
  reflection?: string;
};
export type JournalEntry = { id: string; createdAt: string; text: string };
export type BreathingPractice = {
  id: string;
  createdAt: string;
  rounds: number;
  durationSeconds: number;
};
export type RecoveryAuditEvent = {
  id: string;
  sessionId: string;
  action: "resumed" | "discarded";
  createdAt: string;
};
export type BlsAudioVolumePreference = 0.25 | 0.45 | 0.65;
export type BlsSoundscapePreference = "none" | "rain" | "hum";
export type ExperiencePreferences = {
  onboardingComplete: boolean;
  haptics: boolean;
  reducedMotion: boolean;
  previewSubscriptionTier?: SubscriptionTier;
  blsAudioVolume?: BlsAudioVolumePreference;
  blsSoundscape?: BlsSoundscapePreference;
  lastStereoFeedback?: "clear" | "unclear";
};
export type SafetyPlan = {
  trustedContactName?: string;
  trustedContactPhone?: string;
  copingNote?: string;
  updatedAt: string;
};
type StorageStatus = "ok" | "missing" | "unavailable" | "corrupt";
type StorageResult<T> = {
  value: T;
  status: StorageStatus;
  usedFallback: boolean;
};

const SESSION_KEY = "emdr.session.summaries.v1";
const JOURNAL_KEY = "emdr.journal.entries.v1";
const PREFERENCES_KEY = "emdr.preferences.v1";
const SAFETY_PLAN_KEY = "emdr.safety-plan.v1";
const BREATHING_KEY = "emdr.breathing.practice.v1";
const TELEMETRY_KEY = "emdr.telemetry";
const RECOVERY_AUDIT_KEY = "emdr.recovery-audit.v1";
const MAX_RECORDS = 50;
const MAX_TELEMETRY_RECORDS = 25;
const MAX_JOURNAL_CHARS = 4_000;
const MAX_NOTE_CHARS = 500;
const MAX_FIELD_CHARS = 160;

export type LocalStorageFailureMode =
  | "read"
  | "write"
  | "remove"
  | "all"
  | null;
let localStorageFailureMode: LocalStorageFailureMode = null;
let telemetryQueue: Promise<void> = Promise.resolve();

/** Test-only hook; production callers should leave this unset. */
export function setLocalStorageFailureMode(
  mode: LocalStorageFailureMode,
): void {
  localStorageFailureMode = mode;
}

const DEFAULT_PREFERENCES: ExperiencePreferences = {
  onboardingComplete: false,
  haptics: true,
  reducedMotion: false,
  previewSubscriptionTier: "free",
  blsAudioVolume: 0.45,
  blsSoundscape: "none",
};

function reportStorageFailure(
  operation: string,
  key: string,
  error: unknown,
): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(
      `[local-storage] ${operation} failed for ${key}`,
      error instanceof Error ? error.name : "unknown",
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength
    ? trimmed
    : undefined;
}

function boundedInteger(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  return isFiniteNumber(value) &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : undefined;
}

function normalizePreferences(value: unknown): ExperiencePreferences {
  if (!isRecord(value)) return { ...DEFAULT_PREFERENCES };
  return {
    ...DEFAULT_PREFERENCES,
    onboardingComplete:
      typeof value.onboardingComplete === "boolean"
        ? value.onboardingComplete
        : DEFAULT_PREFERENCES.onboardingComplete,
    haptics:
      typeof value.haptics === "boolean"
        ? value.haptics
        : DEFAULT_PREFERENCES.haptics,
    reducedMotion:
      typeof value.reducedMotion === "boolean"
        ? value.reducedMotion
        : DEFAULT_PREFERENCES.reducedMotion,
    previewSubscriptionTier:
      value.previewSubscriptionTier === "free" ||
      value.previewSubscriptionTier === "basic" ||
      value.previewSubscriptionTier === "professional" ||
      value.previewSubscriptionTier === "enterprise"
        ? value.previewSubscriptionTier
        : DEFAULT_PREFERENCES.previewSubscriptionTier,
    blsAudioVolume:
      value.blsAudioVolume === 0.25 ||
      value.blsAudioVolume === 0.45 ||
      value.blsAudioVolume === 0.65
        ? value.blsAudioVolume
        : DEFAULT_PREFERENCES.blsAudioVolume,
    blsSoundscape:
      value.blsSoundscape === "none" ||
      value.blsSoundscape === "rain" ||
      value.blsSoundscape === "hum"
        ? value.blsSoundscape
        : DEFAULT_PREFERENCES.blsSoundscape,
    ...(value.lastStereoFeedback === "clear" ||
    value.lastStereoFeedback === "unclear"
      ? { lastStereoFeedback: value.lastStereoFeedback }
      : {}),
  };
}

async function readJsonWithStatus<T>(
  key: string,
  fallback: T,
): Promise<StorageResult<T>> {
  try {
    if (localStorageFailureMode === "read" || localStorageFailureMode === "all")
      throw new Error("simulated local read failure");
    const raw = await AsyncStorage.getItem(key);
    if (!raw)
      return { value: fallback, status: "missing", usedFallback: false };
    try {
      return { value: JSON.parse(raw) as T, status: "ok", usedFallback: false };
    } catch (error) {
      reportStorageFailure("parse", key, error);
      return { value: fallback, status: "corrupt", usedFallback: true };
    }
  } catch (error) {
    reportStorageFailure("read", key, error);
    return { value: fallback, status: "unavailable", usedFallback: true };
  }
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  return (await readJsonWithStatus(key, fallback)).value;
}

async function readArrayWithStatus<T>(
  key: string,
  isItem: (value: unknown) => value is T,
): Promise<StorageResult<T[]>> {
  const result = await readJsonWithStatus<unknown>(key, []);
  if (!Array.isArray(result.value))
    return { value: [], status: "corrupt", usedFallback: true };
  const value = result.value.filter(isItem);
  if (value.length !== result.value.length)
    return { value, status: "corrupt", usedFallback: true };
  return { value, status: result.status, usedFallback: result.usedFallback };
}

async function readArray<T>(
  key: string,
  isItem: (value: unknown) => value is T,
): Promise<T[]> {
  return (await readArrayWithStatus(key, isItem)).value;
}

async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    if (
      localStorageFailureMode === "write" ||
      localStorageFailureMode === "all"
    )
      throw new Error("simulated local write failure");
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    reportStorageFailure("write", key, error);
    return false;
  }
}

async function removeKey(key: string): Promise<boolean> {
  try {
    if (
      localStorageFailureMode === "remove" ||
      localStorageFailureMode === "all"
    )
      throw new Error("simulated local remove failure");
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    reportStorageFailure("remove", key, error);
    return false;
  }
}

function isSessionSummary(value: unknown): value is SessionSummary {
  return (
    isRecord(value) &&
    Boolean(boundedText(value.id, MAX_FIELD_CHARS)) &&
    typeof value.createdAt === "string" &&
    boundedInteger(value.durationMinutes, 1, 90) !== undefined &&
    (value.mode === "visual" ||
      value.mode === "audio" ||
      value.mode === "haptic" ||
      value.mode === "mixed") &&
    boundedInteger(value.initialSud, 0, 10) !== undefined &&
    boundedInteger(value.finalSud, 0, 10) !== undefined
  );
}

function isJournalEntry(value: unknown): value is JournalEntry {
  return (
    isRecord(value) &&
    Boolean(boundedText(value.id, MAX_FIELD_CHARS)) &&
    typeof value.createdAt === "string" &&
    Boolean(boundedText(value.text, MAX_JOURNAL_CHARS))
  );
}

function isBreathingPractice(value: unknown): value is BreathingPractice {
  return (
    isRecord(value) &&
    Boolean(boundedText(value.id, MAX_FIELD_CHARS)) &&
    typeof value.createdAt === "string" &&
    boundedInteger(value.rounds, 1, 99) !== undefined &&
    boundedInteger(value.durationSeconds, 1, 7_200) !== undefined
  );
}

function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  return (
    isRecord(value) &&
    Boolean(boundedText(value.id, MAX_FIELD_CHARS)) &&
    typeof value.createdAt === "string" &&
    (value.type === "set-started" ||
      value.type === "set-paused" ||
      value.type === "set-stopped" ||
      value.type === "sud-recorded" ||
      value.type === "supervisor-cue" ||
      value.type === "recovery-resumed" ||
      value.type === "recovery-discarded") &&
    Boolean(boundedText(value.phase, 80)) &&
    (value.value === undefined ||
      boundedInteger(value.value, 0, 10) !== undefined) &&
    (value.note === undefined ||
      Boolean(boundedText(value.note, MAX_NOTE_CHARS)))
  );
}

function isSessionTelemetry(value: unknown): value is SessionTelemetry {
  return (
    isRecord(value) &&
    Boolean(boundedText(value.sessionId, MAX_FIELD_CHARS)) &&
    Boolean(boundedText(value.scenarioId, MAX_FIELD_CHARS)) &&
    typeof value.startedAt === "string" &&
    boundedInteger(value.sets, 0, 999) !== undefined &&
    boundedInteger(value.pauses, 0, 999) !== undefined &&
    Array.isArray(value.events) &&
    value.events.length <= 100 &&
    value.events.every(isTelemetryEvent)
  );
}

function isSafetyPlan(value: unknown): value is SafetyPlan {
  return (
    isRecord(value) &&
    typeof value.updatedAt === "string" &&
    (value.trustedContactName === undefined ||
      Boolean(boundedText(value.trustedContactName, MAX_FIELD_CHARS))) &&
    (value.trustedContactPhone === undefined ||
      Boolean(boundedText(value.trustedContactPhone, 40))) &&
    (value.copingNote === undefined ||
      Boolean(boundedText(value.copingNote, MAX_JOURNAL_CHARS)))
  );
}

function isRecoveryAuditEvent(value: unknown): value is RecoveryAuditEvent {
  return (
    isRecord(value) &&
    Boolean(boundedText(value.id, MAX_FIELD_CHARS)) &&
    Boolean(boundedText(value.sessionId, MAX_FIELD_CHARS)) &&
    (value.action === "resumed" || value.action === "discarded") &&
    typeof value.createdAt === "string"
  );
}

function runTelemetryMutation<T>(operation: () => Promise<T>): Promise<T> {
  const result = telemetryQueue.then(operation, operation);
  telemetryQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function mutateTelemetry(
  mutate: (records: SessionTelemetry[]) => SessionTelemetry[],
): Promise<{ saved: boolean; status: StorageStatus }> {
  return runTelemetryMutation(async () => {
    const current = await readArrayWithStatus(
      TELEMETRY_KEY,
      isSessionTelemetry,
    );
    if (current.status === "unavailable" || current.status === "corrupt") {
      return { saved: false, status: current.status };
    }
    const next = mutate(current.value);
    return {
      saved: await writeJson(
        TELEMETRY_KEY,
        next.slice(0, MAX_TELEMETRY_RECORDS),
      ),
      status: "ok",
    };
  });
}

export async function getSessions(): Promise<SessionSummary[]> {
  return readArray(SESSION_KEY, isSessionSummary);
}

export async function getSessionsWithStatus(): Promise<{
  sessions: SessionSummary[];
  usedFallback: boolean;
}> {
  const result = await readArrayWithStatus(SESSION_KEY, isSessionSummary);
  return { sessions: result.value, usedFallback: result.usedFallback };
}

export async function getTelemetry(): Promise<SessionTelemetry[]> {
  return readArray(TELEMETRY_KEY, isSessionTelemetry);
}

export async function getTelemetryWithStatus(): Promise<{
  records: SessionTelemetry[];
  status: StorageStatus;
  usedFallback: boolean;
}> {
  const result = await readArrayWithStatus(TELEMETRY_KEY, isSessionTelemetry);
  return {
    records: result.value,
    status: result.status,
    usedFallback: result.usedFallback,
  };
}

export async function getInterruptedTelemetry(): Promise<SessionTelemetry | null> {
  const records = await getTelemetry();
  return (
    records.find(
      (item) => !item.endedAt && item.events.at(-1)?.type !== "set-stopped",
    ) ?? null
  );
}

export async function saveTelemetry(
  telemetry: SessionTelemetry,
): Promise<boolean> {
  if (!isSessionTelemetry(telemetry)) return false;
  const result = await mutateTelemetry((records) => [
    telemetry,
    ...records.filter((item) => item.sessionId !== telemetry.sessionId),
  ]);
  return result.saved;
}

export async function updateTelemetryProgress(
  sessionId: string,
  patch: Partial<
    Pick<
      SessionTelemetry,
      | "mode"
      | "audioOn"
      | "hapticsOn"
      | "speed"
      | "durationMinutes"
      | "elapsedSeconds"
      | "scenarioName"
    >
  >,
): Promise<boolean> {
  let found = false;
  const result = await mutateTelemetry((records) =>
    records.map((item) => {
      if (item.sessionId !== sessionId) return item;
      found = true;
      return { ...item, ...patch };
    }),
  );
  return result.saved && found;
}

export async function appendTelemetryEvent(
  sessionId: string,
  event: TelemetryEvent,
): Promise<boolean> {
  if (!isTelemetryEvent(event)) return false;
  let found = false;
  const result = await mutateTelemetry((records) =>
    records.map((item) => {
      if (item.sessionId !== sessionId) return item;
      found = true;
      const events = [...item.events, event].slice(-100);
      return {
        ...item,
        events,
        sets:
          event.type === "set-started"
            ? Math.min(item.sets + 1, 999)
            : item.sets,
        pauses:
          event.type === "set-paused"
            ? Math.min(item.pauses + 1, 999)
            : item.pauses,
        finalSud:
          event.type === "sud-recorded" && event.value !== undefined
            ? event.value
            : item.finalSud,
        endedAt: event.type === "set-stopped" ? event.createdAt : item.endedAt,
      };
    }),
  );
  return result.saved && found;
}

export async function getRecoveryAudit(): Promise<RecoveryAuditEvent[]> {
  return readArray(RECOVERY_AUDIT_KEY, isRecoveryAuditEvent);
}

export async function getRecoveryAuditWithStatus(): Promise<{
  events: RecoveryAuditEvent[];
  usedFallback: boolean;
}> {
  const result = await readArrayWithStatus(
    RECOVERY_AUDIT_KEY,
    isRecoveryAuditEvent,
  );
  return { events: result.value, usedFallback: result.usedFallback };
}

export async function saveRecoveryAudit(
  event: RecoveryAuditEvent,
): Promise<boolean> {
  if (!isRecoveryAuditEvent(event)) return false;
  const existing = await readArrayWithStatus(
    RECOVERY_AUDIT_KEY,
    isRecoveryAuditEvent,
  );
  if (existing.status === "unavailable" || existing.status === "corrupt")
    return false;
  return writeJson(
    RECOVERY_AUDIT_KEY,
    [event, ...existing.value].slice(0, MAX_RECORDS),
  );
}

export async function clearRecoveryAudit(): Promise<boolean> {
  return removeKey(RECOVERY_AUDIT_KEY);
}

export async function discardTelemetry(sessionId: string): Promise<boolean> {
  const result = await mutateTelemetry((records) =>
    records.filter((item) => item.sessionId !== sessionId),
  );
  return result.saved;
}

export async function saveSession(session: SessionSummary): Promise<boolean> {
  if (!isSessionSummary(session)) return false;
  const existing = await getSessions();
  return writeJson(SESSION_KEY, [session, ...existing].slice(0, MAX_RECORDS));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return readArray(JOURNAL_KEY, isJournalEntry);
}

export async function getJournalEntriesWithStatus(): Promise<{
  entries: JournalEntry[];
  usedFallback: boolean;
}> {
  const result = await readArrayWithStatus(JOURNAL_KEY, isJournalEntry);
  return { entries: result.value, usedFallback: result.usedFallback };
}

export async function saveJournalEntry(
  text: string,
): Promise<JournalEntry | null> {
  const safeText = boundedText(text, MAX_JOURNAL_CHARS);
  if (!safeText) return null;
  const entry: JournalEntry = {
    id: `journal_${Date.now()}`,
    createdAt: new Date().toISOString(),
    text: safeText,
  };
  const existing = await getJournalEntries();
  return (await writeJson(
    JOURNAL_KEY,
    [entry, ...existing].slice(0, MAX_RECORDS),
  ))
    ? entry
    : null;
}

export async function getBreathingPractices(): Promise<BreathingPractice[]> {
  return readArray(BREATHING_KEY, isBreathingPractice);
}

export async function getProgressActivity(): Promise<{
  sessions: SessionSummary[];
  breathing: BreathingPractice[];
  usedFallback: boolean;
}> {
  const [sessions, breathing] = await Promise.all([
    readArrayWithStatus(SESSION_KEY, isSessionSummary),
    readArrayWithStatus(BREATHING_KEY, isBreathingPractice),
  ]);
  return {
    sessions: sessions.value,
    breathing: breathing.value,
    usedFallback: sessions.usedFallback || breathing.usedFallback,
  };
}

export async function saveBreathingPractice(
  rounds: number,
  durationSeconds: number,
): Promise<BreathingPractice | null> {
  const safeRounds = boundedInteger(rounds, 1, 99);
  const safeDuration = boundedInteger(durationSeconds, 1, 7_200);
  if (safeRounds === undefined || safeDuration === undefined) return null;
  const practice: BreathingPractice = {
    id: `breath_${Date.now()}`,
    createdAt: new Date().toISOString(),
    rounds: safeRounds,
    durationSeconds: safeDuration,
  };
  const existing = await getBreathingPractices();
  return (await writeJson(
    BREATHING_KEY,
    [practice, ...existing].slice(0, MAX_RECORDS),
  ))
    ? practice
    : null;
}

export async function getPreferences(): Promise<ExperiencePreferences> {
  return normalizePreferences(
    await readJson(PREFERENCES_KEY, DEFAULT_PREFERENCES),
  );
}

export async function savePreferences(
  patch: Partial<ExperiencePreferences>,
): Promise<ExperiencePreferences | null> {
  const next = normalizePreferences({ ...(await getPreferences()), ...patch });
  return (await writeJson(PREFERENCES_KEY, next)) ? next : null;
}

export async function getSafetyPlan(): Promise<SafetyPlan | null> {
  const value = await readJson<unknown>(SAFETY_PLAN_KEY, null);
  return isSafetyPlan(value) ? value : null;
}

export async function getSafetyPlanWithStatus(): Promise<{
  plan: SafetyPlan | null;
  usedFallback: boolean;
}> {
  const result = await readJsonWithStatus<unknown>(SAFETY_PLAN_KEY, null);
  const plan = isSafetyPlan(result.value) ? result.value : null;
  return {
    plan,
    usedFallback:
      result.usedFallback || (result.value !== null && plan === null),
  };
}

export async function saveSafetyPlan(
  plan: Omit<SafetyPlan, "updatedAt">,
): Promise<SafetyPlan | null> {
  const next: SafetyPlan = {
    ...(boundedText(plan.trustedContactName, MAX_FIELD_CHARS)
      ? {
          trustedContactName: boundedText(
            plan.trustedContactName,
            MAX_FIELD_CHARS,
          ),
        }
      : {}),
    ...(boundedText(plan.trustedContactPhone, 40)
      ? { trustedContactPhone: boundedText(plan.trustedContactPhone, 40) }
      : {}),
    ...(boundedText(plan.copingNote, MAX_JOURNAL_CHARS)
      ? { copingNote: boundedText(plan.copingNote, MAX_JOURNAL_CHARS) }
      : {}),
    updatedAt: new Date().toISOString(),
  };
  return (await writeJson(SAFETY_PLAN_KEY, next)) ? next : null;
}

export async function getLocalDataExport() {
  const [
    sessions,
    journal,
    breathing,
    preferences,
    safetyPlan,
    telemetry,
    recoveryAudit,
  ] = await Promise.all([
    getSessions(),
    getJournalEntries(),
    getBreathingPractices(),
    getPreferences(),
    getSafetyPlan(),
    getTelemetry(),
    getRecoveryAudit(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    sessions,
    journal,
    breathing,
    preferences,
    safetyPlan,
    telemetry,
    recoveryAudit,
  };
}

export async function getLocalDataExportWithStatus() {
  const [
    sessions,
    journal,
    breathing,
    preferences,
    safetyPlan,
    telemetry,
    recoveryAudit,
  ] = await Promise.all([
    readArrayWithStatus(SESSION_KEY, isSessionSummary),
    readArrayWithStatus(JOURNAL_KEY, isJournalEntry),
    readArrayWithStatus(BREATHING_KEY, isBreathingPractice),
    readJsonWithStatus<unknown>(PREFERENCES_KEY, DEFAULT_PREFERENCES),
    readJsonWithStatus<unknown>(SAFETY_PLAN_KEY, null),
    readArrayWithStatus(TELEMETRY_KEY, isSessionTelemetry),
    readArrayWithStatus(RECOVERY_AUDIT_KEY, isRecoveryAuditEvent),
  ]);
  const plan = isSafetyPlan(safetyPlan.value) ? safetyPlan.value : null;
  return {
    exportedAt: new Date().toISOString(),
    sessions: sessions.value,
    journal: journal.value,
    breathing: breathing.value,
    preferences: normalizePreferences(preferences.value),
    safetyPlan: plan,
    telemetry: telemetry.value,
    recoveryAudit: recoveryAudit.value,
    usedFallback:
      sessions.usedFallback ||
      journal.usedFallback ||
      breathing.usedFallback ||
      preferences.usedFallback ||
      safetyPlan.usedFallback ||
      (safetyPlan.value !== null && plan === null) ||
      telemetry.usedFallback ||
      recoveryAudit.usedFallback,
  };
}

export async function clearAllLocalData(): Promise<boolean> {
  try {
    if (
      localStorageFailureMode === "remove" ||
      localStorageFailureMode === "all"
    )
      throw new Error("simulated local clear failure");
    await AsyncStorage.multiRemove([
      SESSION_KEY,
      JOURNAL_KEY,
      PREFERENCES_KEY,
      SAFETY_PLAN_KEY,
      BREATHING_KEY,
      TELEMETRY_KEY,
      RECOVERY_AUDIT_KEY,
    ]);
    return true;
  } catch (error) {
    reportStorageFailure("clear", "all", error);
    return false;
  }
}

export async function clearSessions(): Promise<boolean> {
  return removeKey(SESSION_KEY);
}
