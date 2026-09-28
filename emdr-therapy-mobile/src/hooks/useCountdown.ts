import { useEffect, useMemo, useState } from "react";

export function useCountdown(initialSeconds: number, active: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => setSeconds(initialSeconds), [initialSeconds]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(
      () => setSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [active]);

  const display = useMemo(() => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [seconds]);

  return { seconds, display };
}
