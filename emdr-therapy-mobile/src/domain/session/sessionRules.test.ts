import { describe, expect, it } from "vitest";
import {
  applyEvent,
  canPause,
  canResume,
  createInitialSessionState,
} from "./sessionRules";
import type { SessionConfig } from "../../types/session";

const config: SessionConfig = {
  sessionId: "demo",
  durationSeconds: 4,
  audioEnabled: true,
  visualEnabled: true,
  hapticsEnabled: false,
  visualMode: "soft-orb",
  audioVolume: 0.62,
};

describe("session rules", () => {
  it("creates idle state", () => {
    expect(createInitialSessionState().status).toBe("idle");
  });

  it("prevents pausing idle sessions", () => {
    expect(canPause("idle")).toBe(false);
  });

  it("allows resuming an interrupted session", () => {
    expect(canResume("interrupted")).toBe(true);
  });

  it("starts an active session with the configured duration", () => {
    const state = applyEvent(
      createInitialSessionState(),
      { type: "START", timestamp: new Date().toISOString() },
      config,
    );
    expect(state.status).toBe("running");
    expect(state.remainingSeconds).toBe(4);
    expect(state.visualEnabled).toBe(true);
  });

  it("does not advance when paused", () => {
    const started = applyEvent(
      createInitialSessionState(),
      { type: "START", timestamp: new Date().toISOString() },
      config,
    );
    const paused = applyEvent(
      started,
      { type: "PAUSE", timestamp: new Date().toISOString() },
      config,
    );
    const ticked = applyEvent(
      paused,
      { type: "TICK", timestamp: new Date().toISOString() },
      config,
    );
    expect(ticked.elapsedSeconds).toBe(0);
  });

  it("completes through explicit completion", () => {
    const started = applyEvent(
      createInitialSessionState(),
      { type: "START", timestamp: new Date().toISOString() },
      config,
    );
    const complete = applyEvent(
      started,
      { type: "COMPLETE", timestamp: new Date().toISOString() },
      config,
    );
    expect(complete.status).toBe("completed");
    expect(complete.progress).toBe(1);
  });
});
