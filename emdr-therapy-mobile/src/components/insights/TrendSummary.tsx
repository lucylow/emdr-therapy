import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function TrendSummary({
  label,
  value,
  detail,
  tone = "forest",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "forest" | "lavender" | "warm";
}) {
  const fg =
    tone === "forest"
      ? colors.forest
      : tone === "lavender"
        ? colors.lavender
        : colors.warm;
  return (
    <View style={styles.card}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText
        variant="display"
        style={{ fontSize: 30, lineHeight: 34, color: fg, marginTop: 4 }}
      >
        {value}
      </AppText>
      <AppText variant="caption" muted style={{ marginTop: 2 }}>
        {detail}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.silk,
    padding: spacing.lg,
  },
});
