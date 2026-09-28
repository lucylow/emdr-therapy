import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

class AsyncJsonStorage implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      await AsyncStorage.removeItem(key);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}

export const storage = new AsyncJsonStorage();

export const STORAGE_KEYS = {
  onboardingComplete: "@emdrflow/onboarding_complete",
  preferences: "@emdrflow/preferences",
  activeSession: "@emdrflow/active_session",
  reflections: "@emdrflow/reflections",
  sessionHistory: "@emdrflow/session_history",
} as const;
