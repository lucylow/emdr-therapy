import type { SessionState } from "../../types/session";
import {
  deserializeSession,
  serializeSession,
  isRecoverableSession,
} from "../../domain/session/sessionSerializer";
import { storage, STORAGE_KEYS } from "../storage/storage";

export async function persistSessionState(state: SessionState) {
  await storage.set(STORAGE_KEYS.activeSession, serializeSession(state));
}

export async function loadSessionState(): Promise<SessionState | null> {
  const stored = await storage.get<unknown>(STORAGE_KEYS.activeSession);
  const state = deserializeSession(stored);
  if (!state || !isRecoverableSession(state)) return null;
  return state;
}

export async function clearPersistedSession() {
  await storage.remove(STORAGE_KEYS.activeSession);
}

export async function persistSessionSafely(state: SessionState) {
  try {
    await persistSessionState(state);
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error: "We could not save your session locally.",
    };
  }
}

export async function recoverSessionSafely() {
  try {
    const state = await loadSessionState();
    return { ok: true as const, state };
  } catch {
    await clearPersistedSession().catch(() => undefined);
    return { ok: false as const, state: null };
  }
}
