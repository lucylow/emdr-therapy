import { useEffect, useState } from "react";
import { storage } from "../services/storage/storage";

export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    storage
      .get<T>(key)
      .then((stored) => {
        if (!alive) return;
        if (stored !== null) setValue(stored);
        setHydrated(true);
      })
      .catch(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, [key]);

  const update = async (next: T) => {
    setValue(next);
    await storage.set(key, next);
  };

  return { value, update, hydrated };
}
