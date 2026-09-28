import { useEffect, useRef } from "react";
import { AppState } from "react-native";

export function useScreenFocus(
  onBackground: () => void,
  onForeground?: () => void,
) {
  const backgroundRef = useRef(onBackground);
  const foregroundRef = useRef(onForeground);

  useEffect(() => {
    backgroundRef.current = onBackground;
    foregroundRef.current = onForeground;
  });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (status) => {
      if (status !== "active") backgroundRef.current();
      else foregroundRef.current?.();
    });
    return () => sub.remove();
  }, []);
}
