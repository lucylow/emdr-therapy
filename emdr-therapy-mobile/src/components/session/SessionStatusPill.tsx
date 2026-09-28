import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, radii, spacing } from "../../theme/tokens";
import type { SessionStatus } from "../../types/session";

const map: Record<SessionStatus, { label: string; fg: string; bg: string }> = {
  idle: { label: "Ready", fg: colors.graphiteSoft, bg: colors.cloud },
  preparing: { label: "Preparing", fg: colors.forest, bg: colors.forestPale },
  running: { label: "Active", fg: colors.forest, bg: colors.forestPale },
  paused: { label: "Paused", fg: colors.warm, bg: colors.warmPale },
  interrupted: { label: "Interrupted", fg: colors.warm, bg: colors.warmPale },
  completing: { label: "Completing", fg: colors.forest, bg: colors.forestPale },
  completed: { label: "Completed", fg: colors.grow, bg: colors.growPale },
  stopped: { label: "Stopped", fg: colors.graphiteSoft, bg: colors.cloud },
  error: { label: "Needs attention", fg: colors.danger, bg: colors.dangerPale },
};

export function SessionStatusPill({ status }: { status: SessionStatus }) {
  const item = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: item.bg }]}>
      <View style={[styles.dot, { backgroundColor: item.fg }]} />
      <AppText variant="caption" style={{ color: item.fg }}>
        {item.label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
