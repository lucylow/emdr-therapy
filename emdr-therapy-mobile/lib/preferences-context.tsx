import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getPreferences, savePreferences, type ExperiencePreferences } from '@/lib/session-store';

type PreferencesContextValue = ExperiencePreferences & { hydrated: boolean; persistenceError: boolean; persistenceBusy: boolean; setHaptics: (value: boolean) => void; setReducedMotion: (value: boolean) => void; completeOnboarding: () => void; retryPreferences: () => void };
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<ExperiencePreferences>({ onboardingComplete: false, haptics: true, reducedMotion: false });
  const [hydrated, setHydrated] = useState(false);
  const [persistenceError, setPersistenceError] = useState(false);
  const [persistenceBusy, setPersistenceBusy] = useState(false);
  const [lastPatch, setLastPatch] = useState<Partial<ExperiencePreferences> | null>(null);

  useEffect(() => { void getPreferences().then((value) => { setPreferences(value); setHydrated(true); }).catch((error) => { console.warn('[preferences] local read failed', error); setHydrated(true); }); }, []);

  const persist = useCallback((patch: Partial<ExperiencePreferences>) => {
    setPersistenceBusy(true);
    setPersistenceError(false);
    void savePreferences(patch).then((saved) => { if (!saved) setPersistenceError(true); }).catch((error) => { console.warn('[preferences] local write failed', error); setPersistenceError(true); }).finally(() => setPersistenceBusy(false));
  }, []);

  const update = useCallback((patch: Partial<ExperiencePreferences>) => { setPreferences((current) => ({ ...current, ...patch })); setLastPatch(patch); persist(patch); }, [persist]);
  const retryPreferences = useCallback(() => { if (lastPatch) persist(lastPatch); }, [lastPatch, persist]);
  const value = useMemo(() => ({ ...preferences, hydrated, persistenceError, persistenceBusy, setHaptics: (value: boolean) => update({ haptics: value }), setReducedMotion: (value: boolean) => update({ reducedMotion: value }), completeOnboarding: () => update({ onboardingComplete: true }), retryPreferences }), [hydrated, persistenceError, persistenceBusy, preferences, retryPreferences, update]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() { const context = useContext(PreferencesContext); if (!context) throw new Error('usePreferences must be used inside PreferencesProvider'); return context; }

/** Exposed for deterministic tests without requiring a native provider. */
export type { PreferencesContextValue };

