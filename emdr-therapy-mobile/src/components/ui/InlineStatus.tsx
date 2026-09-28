import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, radii, spacing } from "../../theme/tokens";

export function InlineStatus({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const p =
    tone === "success"
      ? { fg: colors.grow, bg: colors.growPale }
      : tone === "warning"
        ? { fg: colors.warm, bg: colors.warmPale }
        : tone === "danger"
          ? { fg: colors.danger, bg: colors.dangerPale }
          : { fg: colors.graphiteSoft, bg: colors.cloud };

  return (
    <View style={[styles.base, { backgroundColor: p.bg }]}>
      <View style={[styles.dot, { backgroundColor: p.fg }]} />
      <AppText variant="caption" style={{ color: p.fg }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
