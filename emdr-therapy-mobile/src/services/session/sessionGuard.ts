import type { SessionState } from "../../types/session";

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

export function canNavigateAwayFromSession(state: SessionState): GuardResult {
  if (
    state.status === "idle" ||
    state.status === "completed" ||
    state.status === "stopped"
  )
    return { allowed: true };
  if (state.status === "running")
    return {
      allowed: false,
      reason: "Active session requires explicit pause or stop.",
    };
  if (state.status === "paused" || state.status === "interrupted")
    return { allowed: true };
  return { allowed: false, reason: "Session is changing state." };
}

export function canStartAnotherSession(state: SessionState): GuardResult {
  return state.status === "idle" ||
    state.status === "completed" ||
    state.status === "stopped"
    ? { allowed: true }
    : { allowed: false, reason: "Finish or stop the current session first." };
}

export function shouldRecover(state: SessionState) {
  return (
    state.status === "running" ||
    state.status === "paused" ||
    state.status === "interrupted"
  );
}

export function safeProgress(state: SessionState) {
  if (!Number.isFinite(state.progress)) return 0;
  return Math.max(0, Math.min(1, state.progress));
}
