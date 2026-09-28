import { isRecoverableSession } from "../../domain/session/sessionSerializer";
import type { SessionState } from "../../types/session";
import { storage, STORAGE_KEYS } from "../storage/storage";

export async function saveActiveSession(state: SessionState) {
  await storage.set(STORAGE_KEYS.activeSession, {
    version: 1,
    savedAt: new Date().toISOString(),
    state,
  });
}

export async function readRecoverableSession() {
  const saved = await storage.get<{ version: 1; state: SessionState }>(
    STORAGE_KEYS.activeSession,
  );
  if (!saved || saved.version !== 1) return null;
  return isRecoverableSession(saved.state) ? saved.state : null;
}

export async function clearActiveSession() {
  await storage.remove(STORAGE_KEYS.activeSession);
}

export async function recoverOrClear() {
  const recovered = await readRecoverableSession();
  if (recovered) return recovered;
  await clearActiveSession();
  return null;
}
