import { useMemo } from "react";
import { colors, layout, radii, spacing, typography } from "./tokens";
import { useAppState } from "../state/AppStateProvider";

export function useTheme() {
  const { preferences } = useAppState();
  return useMemo(
    () => ({
      colors,
      layout,
      radii,
      spacing,
      typography,
      accessibility: preferences.accessibility,
    }),
    [preferences.accessibility],
  );
}
