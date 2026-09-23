import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
    multiRemove: async (keys: string[]) => {
      keys.forEach((key) => store.delete(key));
    },
  },
}));

import {
  appendTelemetryEvent,
  clearAllLocalData,
  clearRecoveryAudit,
  discardTelemetry,
  getInterruptedTelemetry,
  getJournalEntries,
  getJournalEntriesWithStatus,
  getLocalDataExport,
  getLocalDataExportWithStatus,
  getPreferences,
  getProgressActivity,
  getRecoveryAudit,
  getRecoveryAuditWithStatus,
  getSafetyPlan,
  getSafetyPlanWithStatus,
  getSessions,
  getSessionsWithStatus,
  getTelemetry,
  saveJournalEntry,
  savePreferences,
  saveRecoveryAudit,
  saveSafetyPlan,
  saveSession,
  saveTelemetry,
  setLocalStorageFailureMode,
  updateTelemetryProgress,
} from "../lib/session-store";
import { boundedBlsSpeed } from "../lib/training-model";
import {
  getBlsSpeedAccessibilityLabel,
  getBlsToggleAccessibilityLabel,
} from "../lib/bls-accessibility";
import { evaluateAIPolicy } from "../lib/ai-policy";
import { redactTranscript } from "../lib/transcript-boundary";
import { SIMULATED_SCENARIOS } from "../lib/scenarios";
import {
  formatTelemetryTime,
  isNewTelemetryPhase,
  summarizeTelemetry,
} from "../lib/telemetry";
import {
  canUseFeature,
  isProductionEntitled,
  SAFETY_FEATURES,
  SUBSCRIPTION_LIFECYCLE_LABELS,
} from "../lib/monetization";
import {
  createDocumentationDraft,
  getDocumentationRetryMessage,
  setDocumentationFallbackMode,
} from "../lib/documentation";

describe("local therapy storage", () => {
  beforeEach(() => {
    store.clear();
    setLocalStorageFailureMode(null);
  });
  it("saves and reads a session summary locally", async () => {
    await expect(
      saveSession({
        id: "s1",
        createdAt: "2026-01-01T00:00:00.000Z",
        durationMinutes: 10,
        mode: "visual",
        initialSud: 7,
        finalSud: 4,
      }),
    ).resolves.toBe(true);
    await expect(getSessions()).resolves.toHaveLength(1);
  });
  it("keeps journal entries newest first", async () => {
    await saveJournalEntry("First note");
    await saveJournalEntry("Second note");
    const entries = await getJournalEntries();
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toBe("Second note");
  });
  it("merges preferences without removing defaults", async () => {
    await savePreferences({ reducedMotion: true });
    await expect(getPreferences()).resolves.toMatchObject({
      reducedMotion: true,
      haptics: true,
      onboardingComplete: false,
    });
  });
  it("persists a bounded BLS audio volume preference locally", async () => {
    await savePreferences({ blsAudioVolume: 0.25 });
    await expect(getPreferences()).resolves.toMatchObject({
      blsAudioVolume: 0.25,
      haptics: true,
      reducedMotion: false,
    });
  });
  it("persists a local BLS soundscape without removing privacy defaults", async () => {
    await savePreferences({ blsSoundscape: "rain" });
    await expect(getPreferences()).resolves.toMatchObject({
      blsSoundscape: "rain",
      haptics: true,
      reducedMotion: false,
      onboardingComplete: false,
    });
  });
  it("persists stereo-check feedback without removing privacy defaults", async () => {
    await savePreferences({ lastStereoFeedback: "unclear" });
    await expect(getPreferences()).resolves.toMatchObject({
      lastStereoFeedback: "unclear",
      haptics: true,
      reducedMotion: false,
      onboardingComplete: false,
    });
  });
  it("stores the safety plan without requiring sensitive fields", async () => {
    await expect(
      saveSafetyPlan({ copingNote: "Step outside" }),
    ).resolves.toMatchObject({ copingNote: "Step outside" });
    await expect(getSafetyPlan()).resolves.toMatchObject({
      copingNote: "Step outside",
    });
  });
  it("shapes an export without network access", async () => {
    await saveJournalEntry("A note");
    const exported = await getLocalDataExport();
    expect(exported.journal).toHaveLength(1);
    expect(exported).toHaveProperty("exportedAt");
  });
  it("clears all local data in one operation", async () => {
    await saveJournalEntry("A note");
    await savePreferences({ reducedMotion: true });
    await clearAllLocalData();
    await expect(getJournalEntries()).resolves.toHaveLength(0);
    await expect(getPreferences()).resolves.toMatchObject({
      reducedMotion: false,
    });
  });
  it("keeps adaptive BLS inside the therapist-configured limit", () => {
    expect(
      boundedBlsSpeed({ therapistLimit: 4, baselineSpeed: 4, currentSud: 9 }),
    ).toBe(3);
    expect(
      boundedBlsSpeed({ therapistLimit: 4, baselineSpeed: 4, currentSud: 2 }),
    ).toBe(4);
    expect(
      boundedBlsSpeed({ therapistLimit: 2, baselineSpeed: 8, currentSud: 2 }),
    ).toBe(2);
  });
  it("blocks AI until consent, assignment, and trainee activation are present", () => {
    expect(
      evaluateAIPolicy({
        consentGiven: false,
        therapistAssigned: true,
        activatedByTrainee: true,
        fatigue: 0,
        overrideRequested: false,
        traumaReprocessingAllowed: false,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateAIPolicy({
        consentGiven: true,
        therapistAssigned: true,
        activatedByTrainee: true,
        fatigue: 0,
        overrideRequested: false,
        traumaReprocessingAllowed: false,
      }).allowed,
    ).toBe(true);
  });
  it("redacts basic identifiers before transcript use", () => {
    expect(
      redactTranscript("Email jane@example.com MRN: ABC-12 phone 555-222-1234"),
    ).toContain("[email redacted]");
    expect(
      redactTranscript("Email jane@example.com MRN: ABC-12 phone 555-222-1234"),
    ).toContain("[record identifier redacted]");
  });
  it("keeps scenario catalog fictional and telemetry summaries non-clinical", () => {
    expect(
      SIMULATED_SCENARIOS.every((scenario) => scenario.id.length > 0),
    ).toBe(true);
    expect(
      summarizeTelemetry({
        sessionId: "s",
        scenarioId: "steady-start",
        startedAt: "now",
        sets: 2,
        pauses: 1,
        initialSud: 6,
        finalSud: 4,
        events: [],
      }).sudChange,
    ).toBe(2);
  });
  it("persists resumable mode, duration, elapsed progress, and scenario name", async () => {
    await saveTelemetry({
      sessionId: "resume",
      scenarioId: "steady-start",
      startedAt: "start",
      sets: 1,
      pauses: 0,
      events: [],
    });
    await updateTelemetryProgress("resume", {
      mode: "mixed",
      audioOn: true,
      hapticsOn: false,
      speed: 3,
      durationMinutes: 15,
      elapsedSeconds: 42,
      scenarioName: "Steady Start",
    });
    await expect(getTelemetry()).resolves.toContainEqual(
      expect.objectContaining({
        sessionId: "resume",
        mode: "mixed",
        audioOn: true,
        hapticsOn: false,
        speed: 3,
        durationMinutes: 15,
        elapsedSeconds: 42,
        scenarioName: "Steady Start",
      }),
    );
  });
  it("clears only recovery history without removing telemetry", async () => {
    await saveRecoveryAudit({
      id: "audit-3",
      sessionId: "s3",
      action: "resumed",
      createdAt: "now",
    });
    await saveTelemetry({
      sessionId: "s3",
      scenarioId: "steady-start",
      startedAt: "start",
      sets: 1,
      pauses: 0,
      events: [],
    });
    await clearRecoveryAudit();
    await expect(getRecoveryAudit()).resolves.toHaveLength(0);
    await expect(getTelemetry()).resolves.toHaveLength(1);
  });
  it("persists recovery audit events and includes them in export", async () => {
    await expect(
      saveRecoveryAudit({
        id: "audit-1",
        sessionId: "s1",
        action: "resumed",
        createdAt: "now",
      }),
    ).resolves.toBe(true);
    await expect(getRecoveryAudit()).resolves.toHaveLength(1);
    await expect(getLocalDataExport()).resolves.toHaveProperty(
      "recoveryAudit",
      [expect.objectContaining({ action: "resumed" })],
    );
  });
  it("clears recovery audit events with all local data", async () => {
    await saveRecoveryAudit({
      id: "audit-2",
      sessionId: "s2",
      action: "discarded",
      createdAt: "now",
    });
    await clearAllLocalData();
    await expect(getRecoveryAudit()).resolves.toHaveLength(0);
  });
  it("discards only the selected unfinished telemetry record", async () => {
    await saveTelemetry({
      sessionId: "remove-me",
      scenarioId: "steady-start",
      startedAt: "start",
      sets: 1,
      pauses: 0,
      events: [],
    });
    await saveTelemetry({
      sessionId: "keep-me",
      scenarioId: "steady-start",
      startedAt: "start",
      sets: 1,
      pauses: 0,
      events: [],
    });
    await expect(discardTelemetry("remove-me")).resolves.toBe(true);
    await expect(getTelemetry()).resolves.toEqual([
      expect.objectContaining({ sessionId: "keep-me" }),
    ]);
  });
  it("detects an unfinished local session for recovery", async () => {
    await saveTelemetry({
      sessionId: "unfinished",
      scenarioId: "steady-start",
      startedAt: "start",
      sets: 1,
      pauses: 0,
      events: [
        {
          id: "start",
          createdAt: "start",
          type: "set-started",
          phase: "Processing",
        },
      ],
    });
    await expect(getInterruptedTelemetry()).resolves.toMatchObject({
      sessionId: "unfinished",
    });
    await appendTelemetryEvent("unfinished", {
      id: "stop",
      createdAt: "stop",
      type: "set-stopped",
      phase: "Processing",
    });
    await expect(getInterruptedTelemetry()).resolves.toBeNull();
  });
  it("aggregates live telemetry lifecycle events locally", async () => {
    await saveTelemetry({
      sessionId: "live",
      scenarioId: "steady-start",
      startedAt: "start",
      initialSud: 7,
      sets: 1,
      pauses: 0,
      events: [],
    });
    await appendTelemetryEvent("live", {
      id: "pause",
      createdAt: "pause-time",
      type: "set-paused",
      phase: "Processing",
    });
    await appendTelemetryEvent("live", {
      id: "resume",
      createdAt: "resume-time",
      type: "set-started",
      phase: "Processing",
    });
    await appendTelemetryEvent("live", {
      id: "sud",
      createdAt: "sud-time",
      type: "sud-recorded",
      phase: "Closure",
      value: 4,
    });
    await appendTelemetryEvent("live", {
      id: "stop",
      createdAt: "stop-time",
      type: "set-stopped",
      phase: "Closure",
    });
    const telemetry = (await getTelemetry())[0];
    expect(telemetry.sets).toBe(2);
    expect(telemetry.pauses).toBe(1);
    expect(telemetry.finalSud).toBe(4);
    expect(telemetry.endedAt).toBe("stop-time");
  });
  it("formats telemetry times and detects phase boundaries", () => {
    const events = [
      {
        id: "a",
        createdAt: "2026-01-01T12:00:00.000Z",
        type: "set-started" as const,
        phase: "Processing",
      },
      {
        id: "b",
        createdAt: "2026-01-01T12:01:00.000Z",
        type: "set-paused" as const,
        phase: "Processing",
      },
      {
        id: "c",
        createdAt: "2026-01-01T12:02:00.000Z",
        type: "set-stopped" as const,
        phase: "Closure",
      },
    ];
    expect(formatTelemetryTime(events[0].createdAt)).not.toBe(
      "time unavailable",
    );
    expect(isNewTelemetryPhase(events, 0)).toBe(true);
    expect(isNewTelemetryPhase(events, 1)).toBe(false);
    expect(isNewTelemetryPhase(events, 2)).toBe(true);
  });
  it("reports unavailable status for recovery audit storage failures", async () => {
    setLocalStorageFailureMode("read");
    await expect(getRecoveryAuditWithStatus()).resolves.toMatchObject({
      events: [],
      usedFallback: true,
    });
    setLocalStorageFailureMode(null);
  });
  it("reports unavailable status for local export when storage is unavailable", async () => {
    setLocalStorageFailureMode("read");
    await expect(getLocalDataExportWithStatus()).resolves.toMatchObject({
      usedFallback: true,
    });
    setLocalStorageFailureMode(null);
  });
  it("reports unavailable status for safety-plan storage failures", async () => {
    setLocalStorageFailureMode("read");
    await expect(getSafetyPlanWithStatus()).resolves.toMatchObject({
      plan: null,
      usedFallback: true,
    });
    setLocalStorageFailureMode(null);
  });
  it("reports unavailable status for journal storage failures", async () => {
    setLocalStorageFailureMode("read");
    await expect(getJournalEntriesWithStatus()).resolves.toMatchObject({
      entries: [],
      usedFallback: true,
    });
    setLocalStorageFailureMode(null);
  });
  it("reports deterministic fallback status for unavailable progress storage", async () => {
    setLocalStorageFailureMode("read");
    await expect(getProgressActivity()).resolves.toMatchObject({
      sessions: [],
      breathing: [],
      usedFallback: true,
    });
    setLocalStorageFailureMode(null);
  });
  it("falls back safely when persisted telemetry is malformed", async () => {
    store.set("emdr.telemetry", "{not-json");
    await expect(getTelemetry()).resolves.toEqual([]);
  });
  it("does not overwrite corrupted telemetry without an explicit recovery action", async () => {
    store.set("emdr.telemetry", "{not-json");
    await expect(
      saveTelemetry({
        sessionId: "new-record",
        scenarioId: "steady-start",
        startedAt: "now",
        sets: 1,
        pauses: 0,
        events: [],
      }),
    ).resolves.toBe(false);
    expect(store.get("emdr.telemetry")).toBe("{not-json");
  });
  it("normalizes malformed preferences to safe defaults without leaking invalid values", async () => {
    store.set(
      "emdr.preferences.v1",
      JSON.stringify({
        onboardingComplete: "yes",
        haptics: false,
        reducedMotion: "no",
        blsAudioVolume: 0.99,
        blsSoundscape: "ocean",
        lastStereoFeedback: "unknown",
      }),
    );
    await expect(getPreferences()).resolves.toMatchObject({
      onboardingComplete: false,
      haptics: false,
      reducedMotion: false,
      blsAudioVolume: 0.45,
      blsSoundscape: "none",
    });
  });
  it("turns malformed review collections into safe unavailable fallbacks", async () => {
    store.set(
      "emdr.journal.entries.v1",
      JSON.stringify({ text: "not-a-list" }),
    );
    store.set("emdr.recovery-audit.v1", JSON.stringify("not-a-list"));
    await expect(getJournalEntriesWithStatus()).resolves.toMatchObject({
      entries: [],
      usedFallback: true,
    });
    await expect(getRecoveryAuditWithStatus()).resolves.toMatchObject({
      events: [],
      usedFallback: true,
    });
  });
  it("marks malformed progress collections unavailable without throwing", async () => {
    store.set(
      "emdr.session.summaries.v1",
      JSON.stringify({ sessionId: "not-a-list" }),
    );
    store.set("emdr.breathing.practice.v1", JSON.stringify(null));
    await expect(getProgressActivity()).resolves.toMatchObject({
      sessions: [],
      breathing: [],
      usedFallback: true,
    });
  });
  it("fails closed when the local safety plan has an invalid shape", async () => {
    store.set("emdr.safety-plan.v1", JSON.stringify({ copingNote: 42 }));
    await expect(getSafetyPlanWithStatus()).resolves.toMatchObject({
      plan: null,
      usedFallback: true,
    });
  });
  it("keeps valid history while filtering malformed records", async () => {
    store.set(
      "emdr.session.summaries.v1",
      JSON.stringify([
        {
          id: "valid",
          createdAt: "now",
          durationMinutes: 5,
          mode: "visual",
          initialSud: 5,
          finalSud: 4,
        },
        { id: 42 },
      ]),
    );
    await expect(getSessionsWithStatus()).resolves.toMatchObject({
      sessions: [{ id: "valid" }],
      usedFallback: true,
    });
  });
  it("reports failed preference writes without losing the in-memory contract", async () => {
    setLocalStorageFailureMode("write");
    await expect(savePreferences({ reducedMotion: true })).resolves.toBeNull();
    setLocalStorageFailureMode(null);
  });
  it("reports failed safety-plan writes without losing the draft contract", async () => {
    setLocalStorageFailureMode("write");
    await expect(
      saveSafetyPlan({ copingNote: "Keep this draft" }),
    ).resolves.toBeNull();
    setLocalStorageFailureMode(null);
  });
  it("contains simulated storage failures without throwing", async () => {
    setLocalStorageFailureMode("read");
    await expect(getSessions()).resolves.toEqual([]);
    setLocalStorageFailureMode("write");
    await expect(
      saveTelemetry({
        sessionId: "failed-telemetry",
        scenarioId: "steady-start",
        startedAt: "now",
        sets: 0,
        pauses: 0,
        events: [],
      }),
    ).resolves.toBe(false);
    await expect(
      saveSession({
        id: "failed",
        createdAt: "now",
        durationMinutes: 1,
        mode: "visual",
        initialSud: 4,
        finalSud: 4,
      }),
    ).resolves.toBe(false);
    await expect(saveJournalEntry("failed journal")).resolves.toBeNull();
    await expect(
      saveRecoveryAudit({
        id: "failed-audit",
        sessionId: "failed",
        action: "discarded",
        createdAt: "now",
      }),
    ).resolves.toBe(false);
    await expect(discardTelemetry("failed")).resolves.toBe(false);
    await expect(
      appendTelemetryEvent("failed-telemetry", {
        id: "event",
        createdAt: "now",
        type: "set-started",
        phase: "Processing",
      }),
    ).resolves.toBe(false);
    setLocalStorageFailureMode("remove");
    await expect(clearAllLocalData()).resolves.toBe(false);
    await expect(clearRecoveryAudit()).resolves.toBe(false);
    setLocalStorageFailureMode(null);
  });
  it("keeps documentation drafts review-required and bounded", () => {
    const draft = createDocumentationDraft(true);
    expect(draft.status).toBe("needs-review");
    expect(draft.source).toBe("structured session summary");
    expect(draft.reviewNotes).toBe("");
  });
  it("supports deterministic documentation fallback and retry messaging", () => {
    setDocumentationFallbackMode(true);
    expect(() => createDocumentationDraft(true)).toThrow(
      "simulated documentation fallback",
    );
    expect(getDocumentationRetryMessage("fallback")).toContain(
      "deterministic training preview",
    );
    expect(getDocumentationRetryMessage("retry-failed")).toContain(
      "still unavailable",
    );
    setDocumentationFallbackMode(false);
  });
  it("creates explicit BLS accessibility labels for toggles and speed", () => {
    expect(getBlsToggleAccessibilityLabel("audio", true)).toBe("Audio cues on");
    expect(getBlsToggleAccessibilityLabel("haptics", false)).toBe(
      "Haptic cues off",
    );
    expect(getBlsSpeedAccessibilityLabel(1)).toBe("BLS speed slow");
    expect(getBlsSpeedAccessibilityLabel(2)).toBe("BLS speed medium");
    expect(getBlsSpeedAccessibilityLabel(3)).toBe("BLS speed fast");
  });
  it("keeps lifecycle states explicit and production access verified-only", () => {
    expect(Object.keys(SUBSCRIPTION_LIFECYCLE_LABELS)).toEqual([
      "preview",
      "pending",
      "verified",
      "expired",
    ]);
    expect(isProductionEntitled("preview")).toBe(false);
    expect(isProductionEntitled("pending")).toBe(false);
    expect(isProductionEntitled("verified")).toBe(true);
    expect(isProductionEntitled("expired")).toBe(false);
  });
  it("never makes safety features depend on a subscription tier", () => {
    expect(SAFETY_FEATURES).toEqual([
      "Grounding library",
      "Crisis resources",
      "Stop-to-grounding controls",
      "Local data deletion",
    ]);
    expect(canUseFeature("free", "professional", "preview")).toBe(false);
    expect(canUseFeature("free", "professional", "verified")).toBe(false);
  });
});
