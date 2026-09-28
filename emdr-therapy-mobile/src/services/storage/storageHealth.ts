import { storage, STORAGE_KEYS } from "./storage";

export interface StorageHealth {
  ok: boolean;
  onboardingReadable: boolean;
  preferencesReadable: boolean;
  activeSessionReadable: boolean;
  reflectionsReadable: boolean;
  repaired: boolean;
}

export async function checkStorageHealth(): Promise<StorageHealth> {
  let repaired = false;
  let onboardingReadable = true;
  let preferencesReadable = true;
  let activeSessionReadable = true;
  let reflectionsReadable = true;

  try {
    await storage.get(STORAGE_KEYS.onboardingComplete);
  } catch {
    onboardingReadable = false;
  }
  try {
    await storage.get(STORAGE_KEYS.preferences);
  } catch {
    preferencesReadable = false;
  }
  try {
    await storage.get(STORAGE_KEYS.activeSession);
  } catch {
    activeSessionReadable = false;
  }
  try {
    await storage.get(STORAGE_KEYS.reflections);
  } catch {
    reflectionsReadable = false;
  }

  if (
    !onboardingReadable ||
    !preferencesReadable ||
    !activeSessionReadable ||
    !reflectionsReadable
  ) {
    try {
      await Promise.allSettled([
        storage.remove(STORAGE_KEYS.onboardingComplete),
        storage.remove(STORAGE_KEYS.preferences),
        storage.remove(STORAGE_KEYS.activeSession),
        storage.remove(STORAGE_KEYS.reflections),
      ]);
      repaired = true;
    } catch {}
  }

  return {
    ok:
      onboardingReadable &&
      preferencesReadable &&
      activeSessionReadable &&
      reflectionsReadable,
    onboardingReadable,
    preferencesReadable,
    activeSessionReadable,
    reflectionsReadable,
    repaired,
  };
}
