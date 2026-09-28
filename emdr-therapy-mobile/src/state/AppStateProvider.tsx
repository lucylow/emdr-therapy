import React, { createContext, useContext, useMemo, useState } from "react";
import type { AppPreferences } from "../domain/preferences/preferencesSchema";
import {
  DEFAULT_PREFERENCES,
  updateAudioPreference,
} from "../domain/preferences/preferencesSchema";
import type { Reflection } from "../data/mock";
import { REFLECTIONS } from "../data/mock";
import { storage, STORAGE_KEYS } from "../services/storage/storage";

interface AppStateValue {
  onboardingComplete: boolean;
  preferences: AppPreferences;
  reflections: Reflection[];
  profileName: string;
  setOnboardingComplete: (value: boolean) => Promise<void>;
  setPreferences: (next: AppPreferences) => Promise<void>;
  updateAudio: (patch: Partial<AppPreferences["audio"]>) => Promise<void>;
  addReflection: (reflection: Reflection) => Promise<void>;
  resetDemo: () => Promise<void>;
}

const Context = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: React.PropsWithChildren) {
  const [onboardingComplete, setOnboardingState] = useState(false);
  const [preferences, setPreferencesState] = useState(DEFAULT_PREFERENCES);
  const [reflections, setReflections] = useState(REFLECTIONS);

  const setOnboardingComplete = async (value: boolean) => {
    setOnboardingState(value);
    await storage.set(STORAGE_KEYS.onboardingComplete, value);
  };

  const setPreferences = async (next: AppPreferences) => {
    setPreferencesState(next);
    await storage.set(STORAGE_KEYS.preferences, next);
  };

  const updateAudio = async (patch: Partial<AppPreferences["audio"]>) => {
    await setPreferences(updateAudioPreference(preferences, patch));
  };

  const addReflection = async (reflection: Reflection) => {
    const next = [reflection, ...reflections];
    setReflections(next);
    await storage.set(STORAGE_KEYS.reflections, next);
  };

  const resetDemo = async () => {
    setReflections(REFLECTIONS);
    setPreferencesState(DEFAULT_PREFERENCES);
    setOnboardingState(false);
    await Promise.allSettled([
      storage.remove(STORAGE_KEYS.onboardingComplete),
      storage.remove(STORAGE_KEYS.preferences),
      storage.remove(STORAGE_KEYS.activeSession),
      storage.remove(STORAGE_KEYS.reflections),
    ]);
  };

  const value = useMemo(
    () => ({
      onboardingComplete,
      preferences,
      reflections,
      profileName: "Alex Morgan",
      setOnboardingComplete,
      setPreferences,
      updateAudio,
      addReflection,
      resetDemo,
    }),
    [onboardingComplete, preferences, reflections],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppState() {
  const value = useContext(Context);
  if (!value)
    throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}
