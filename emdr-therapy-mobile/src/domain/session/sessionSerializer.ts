import type { SessionState } from "../../types/session";

export interface PersistedSession {
  version: 1;
  savedAt: string;
  state: SessionState;
}

export function serializeSession(state: SessionState): PersistedSession {
  return { version: 1, savedAt: new Date().toISOString(), state };
}

export function deserializeSession(value: unknown): SessionState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PersistedSession>;
  if (candidate.version !== 1 || !candidate.state) return null;
  if (typeof candidate.state.elapsedSeconds !== "number") return null;
  if (typeof candidate.state.remainingSeconds !== "number") return null;
  if (typeof candidate.state.progress !== "number") return null;
  return candidate.state;
}

export function isRecoverableSession(state: SessionState) {
  return (
    ["running", "paused", "interrupted"].includes(state.status) &&
    Boolean(state.sessionId)
  );
}
