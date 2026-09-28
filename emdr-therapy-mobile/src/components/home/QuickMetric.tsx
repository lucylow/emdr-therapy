import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function QuickMetric({
  value,
  label,
  tone = "forest",
}: {
  value: string;
  label: string;
  tone?: "forest" | "lavender" | "warm";
}) {
  const bg =
    tone === "forest"
      ? colors.forestPale
      : tone === "lavender"
        ? colors.lavenderPale
        : colors.warmPale;
  const fg =
    tone === "forest"
      ? colors.forest
      : tone === "lavender"
        ? colors.lavender
        : colors.warm;
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <AppText variant="h2" style={{ color: fg }}>
        {value}
      </AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, padding: spacing.lg },
});
