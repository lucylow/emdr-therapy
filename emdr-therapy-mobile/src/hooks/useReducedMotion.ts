import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setEnabled,
    );
    return () => {
      mounted = false;
      listener.remove();
    };
  }, []);

  return enabled;
}
