import type {
  SessionConfig,
  SessionEvent,
  SessionState,
  SessionStatus,
} from "../../types/session";

const TERMINAL: SessionStatus[] = ["completed", "stopped", "error"];

export function createInitialSessionState(): SessionState {
  return {
    status: "idle",
    sessionId: null,
    elapsedSeconds: 0,
    remainingSeconds: 0,
    progress: 0,
    audioState: "idle",
    visualEnabled: false,
  };
}

export function isTerminalState(status: SessionStatus) {
  return TERMINAL.includes(status);
}
export function canStart(status: SessionStatus) {
  return status === "idle" || isTerminalState(status);
}
export function canPause(status: SessionStatus) {
  return status === "running";
}
export function canResume(status: SessionStatus) {
  return status === "paused" || status === "interrupted";
}

export function applyEvent(
  current: SessionState,
  event: SessionEvent,
  config: SessionConfig,
): SessionState {
  switch (event.type) {
    case "START":
      if (!canStart(current.status)) return current;
      return {
        ...current,
        status: "running",
        sessionId: config.sessionId,
        elapsedSeconds: 0,
        remainingSeconds: config.durationSeconds,
        progress: 0,
        audioState: config.audioEnabled ? "loading" : "idle",
        visualEnabled: config.visualEnabled,
        errorMessage: undefined,
        startedAt: event.timestamp,
        completedAt: undefined,
      };
    case "AUDIO_READY":
      return { ...current, audioState: "ready" };
    case "AUDIO_ERROR":
      return {
        ...current,
        audioState: "error",
        errorMessage: event.message || "Audio is unavailable.",
      };
    case "PAUSE":
      return canPause(current.status)
        ? {
            ...current,
            status: "paused",
            audioState:
              current.audioState === "playing" ? "paused" : current.audioState,
          }
        : current;
    case "RESUME":
      return canResume(current.status)
        ? {
            ...current,
            status: "running",
            audioState:
              current.audioState === "paused" || current.audioState === "ready"
                ? "playing"
                : current.audioState,
          }
        : current;
    case "INTERRUPT":
      return ["running", "paused"].includes(current.status)
        ? {
            ...current,
            status: "interrupted",
            audioState:
              current.audioState === "playing"
                ? "interrupted"
                : current.audioState,
          }
        : current;
    case "TICK": {
      if (current.status !== "running") return current;
      const remaining = Math.max(0, current.remainingSeconds - 1);
      const elapsed = Math.min(
        config.durationSeconds,
        current.elapsedSeconds + 1,
      );
      const progress =
        config.durationSeconds <= 0 ? 0 : elapsed / config.durationSeconds;
      return {
        ...current,
        elapsedSeconds: elapsed,
        remainingSeconds: remaining,
        progress,
        status: remaining === 0 ? "completing" : "running",
      };
    }
    case "COMPLETE":
      return {
        ...current,
        status: "completed",
        progress: 1,
        remainingSeconds: 0,
        elapsedSeconds: config.durationSeconds,
        completedAt: event.timestamp,
        audioState: "paused",
      };
    case "STOP":
      return { ...current, status: "stopped", audioState: "paused" };
    case "RESET":
      return createInitialSessionState();
    default:
      return current;
  }
}
