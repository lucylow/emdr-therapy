import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { WEEKLY_DATA } from "../../data/mock";
import { colors, spacing } from "../../theme/tokens";

export function WeeklyChart() {
  const max = Math.max(1, ...WEEKLY_DATA.map((p) => p.minutes));
  return (
    <View style={styles.chart}>
      {WEEKLY_DATA.map((p, i) => (
        <View key={`${p.label}-${i}`} style={styles.column}>
          <View style={styles.track}>
            <View
              accessible
              accessibilityLabel={`${p.minutes} minutes on ${p.label}`}
              style={[
                styles.bar,
                {
                  height: 22 + (p.minutes / max) * 98,
                  backgroundColor: p.minutes ? colors.forest : colors.silk,
                },
              ]}
            />
          </View>
          <AppText variant="caption" muted>
            {p.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  chart: {
    height: 150,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    gap: spacing.md,
  },
  column: { flex: 1, alignItems: "center", gap: spacing.sm },
  track: {
    height: 120,
    width: 18,
    backgroundColor: colors.cloud,
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 10 },
});
