import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/tokens";

export function ProgressRing({
  progress,
  size = 86,
  label = "Progress",
  value,
}: {
  progress: number;
  size?: number;
  label?: string;
  value?: string;
}) {
  const pct = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.track,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
      <View
        style={[
          styles.fill,
          {
            width: size * 0.48,
            height: 6,
            left: size * 0.26,
            transform: [{ scaleX: pct }],
          },
        ]}
      />
      <AppText variant="h3" style={{ fontSize: 16 }}>
        {value ?? `${Math.round(pct * 100)}%`}
      </AppText>
      <AppText variant="caption" muted style={{ fontSize: 10 }}>
        {label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  track: {
    position: "absolute",
    borderWidth: 7,
    borderColor: colors.forestPale,
  },
  fill: {
    position: "absolute",
    bottom: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forest,
    transformOrigin: "center",
  },
});
