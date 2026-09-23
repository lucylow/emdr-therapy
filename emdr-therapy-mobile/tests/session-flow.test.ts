import { describe, expect, it } from "vitest";
import {
  carrySessionParams,
  createSessionStartParams,
  normalizeSessionParams,
} from "../lib/session-flow";
import { recoveryActionLabel } from "../lib/recovery-status";
import {
  BLS_AUDIO_VOLUMES,
  BLS_MAX_AUDIO_VOLUME,
  getBlsAudioStatusLabel,
  getBlsAudioVolumeLabel,
  getBlsCueIntervalMs,
  isBlsAudioVolume,
} from "../lib/bls-audio";

describe("session flow contracts", () => {
  it("creates a complete setup handoff with safe scenario defaults", () => {
    expect(createSessionStartParams({ duration: 10, mode: "visual" })).toEqual({
      duration: "10",
      mode: "visual",
      scenarioId: "steady-start",
      scenarioName: "Steady Start",
    });
  });

  it("preserves scenario and BLS recovery settings across later phases", () => {
    const setup = createSessionStartParams({
      duration: 15,
      mode: "mixed",
      scenarioId: "rising-tension",
      scenarioName: "Rising Tension",
    });
    const assessment = carrySessionParams({ ...setup, sud: "7" });
    const bls = carrySessionParams({
      ...assessment,
      sessionId: "training-123",
      elapsedSeconds: "42",
      audioOn: "true",
      hapticsOn: "false",
      speed: "2",
    });
    const grounding = carrySessionParams(bls);

    expect(grounding).toMatchObject({
      duration: "15",
      mode: "mixed",
      scenarioId: "rising-tension",
      scenarioName: "Rising Tension",
      sud: "7",
      sessionId: "training-123",
      elapsedSeconds: "42",
      audioOn: "true",
      hapticsOn: "false",
      speed: "2",
    });
  });

  it("announces recovery actions consistently across idle, working, and error states", () => {
    expect(recoveryActionLabel("ground", "idle")).toBe(
      "Ground instead of resuming",
    );
    expect(recoveryActionLabel("resume", "working")).toBe("Resuming session");
    expect(recoveryActionLabel("ground", "working")).toBe("Opening grounding");
    expect(recoveryActionLabel("discard", "error")).toBe(
      "Try recovery action again",
    );
  });

  it("keeps audio volume presets bounded and labels them consistently", () => {
    expect(BLS_AUDIO_VOLUMES).toEqual([0.25, 0.45, 0.65]);
    expect(BLS_MAX_AUDIO_VOLUME).toBe(0.65);
    expect(getBlsCueIntervalMs(1)).toBe(1500);
    expect(getBlsCueIntervalMs(2)).toBe(1150);
    expect(getBlsCueIntervalMs(3)).toBe(850);
    expect(Math.max(...BLS_AUDIO_VOLUMES)).toBeLessThanOrEqual(
      BLS_MAX_AUDIO_VOLUME,
    );
    expect(getBlsAudioVolumeLabel(0.25)).toBe("Low");
    expect(getBlsAudioVolumeLabel(0.45)).toBe("Comfortable");
    expect(getBlsAudioVolumeLabel(0.65)).toBe("Higher");
    expect(
      getBlsAudioStatusLabel({
        enabled: true,
        unavailable: false,
        preparing: true,
        ready: false,
        playing: false,
        volume: 0.45,
      }),
    ).toContain("preparing");
    expect(
      getBlsAudioStatusLabel({
        enabled: true,
        unavailable: false,
        preparing: false,
        ready: true,
        playing: false,
        volume: 0.45,
      }),
    ).toContain("ready");
    expect(isBlsAudioVolume(0.45)).toBe(true);
    expect(isBlsAudioVolume(0.9)).toBe(false);
  });

  it("keeps visual stimulation primary when audio is unavailable or disabled", () => {
    expect(
      getBlsAudioStatusLabel({
        enabled: false,
        unavailable: false,
        playing: false,
        volume: 0.45,
      }),
    ).toBe("Audio cues off. Visual stimulation remains active.");
    expect(
      getBlsAudioStatusLabel({
        enabled: true,
        unavailable: true,
        playing: false,
        volume: 0.45,
      }),
    ).toBe("Audio cues unavailable. Visual stimulation remains active.");
    expect(
      getBlsAudioStatusLabel({
        enabled: true,
        unavailable: false,
        playing: true,
        volume: 0.25,
      }),
    ).toBe("Audio cues enabled at low volume, currently playing.");
  });

  it("removes empty route values instead of leaking blank state into a later phase", () => {
    expect(
      carrySessionParams({
        duration: "10",
        mode: "visual",
        scenarioId: "",
        scenarioName: undefined,
        sud: "0",
      }),
    ).toEqual({ duration: "10", mode: "visual", sud: "0" });
  });

  it("normalizes malformed deep-link session inputs before rendering or persistence", () => {
    expect(
      normalizeSessionParams({
        duration: "not-a-number",
        mode: "unknown" as any,
        sud: "99",
        elapsedSeconds: "-8",
        speed: "9",
        audioOn: "invalid",
        hapticsOn: "true",
        sessionId: "x".repeat(121),
      }),
    ).toMatchObject({
      duration: "10",
      mode: "visual",
      sud: "10",
      elapsedSeconds: "0",
      speed: "3",
      audioOn: "false",
      hapticsOn: "true",
    });
    expect(
      normalizeSessionParams({ sessionId: "x".repeat(121) }).sessionId,
    ).toBeUndefined();
  });
});
