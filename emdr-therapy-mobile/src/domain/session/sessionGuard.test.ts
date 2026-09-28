import { describe, expect, it } from "vitest";
import {
  canNavigateAwayFromSession,
  canStartAnotherSession,
  safeProgress,
} from "../../services/session/sessionGuard";
import type { SessionState } from "../../types/session";

const base: SessionState = {
  status: "running",
  sessionId: "evening-reset",
  elapsedSeconds: 10,
  remainingSeconds: 590,
  progress: 0.1,
  audioState: "playing",
  visualEnabled: true,
};

describe("session guards", () => {
  it("blocks navigation from an active session", () => {
    expect(canNavigateAwayFromSession(base).allowed).toBe(false);
  });
  it("allows navigation from a paused session", () => {
    expect(
      canNavigateAwayFromSession({ ...base, status: "paused" }).allowed,
    ).toBe(true);
  });
  it("blocks a second session while active", () => {
    expect(canStartAnotherSession(base).allowed).toBe(false);
  });
  it("clamps invalid progress", () => {
    expect(safeProgress({ ...base, progress: 2 })).toBe(1);
    expect(safeProgress({ ...base, progress: -1 })).toBe(0);
  });
});
