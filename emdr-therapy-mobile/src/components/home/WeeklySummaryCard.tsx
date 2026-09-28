import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { ProgressRing } from "../session/ProgressRing";
import { colors, spacing } from "../../theme/tokens";

export function WeeklySummaryCard({
  sessions,
  minutes,
  reflections,
}: {
  sessions: number;
  minutes: number;
  reflections: number;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="overline" style={{ color: colors.forest }}>
            THIS WEEK
          </AppText>
          <AppText variant="h2" style={{ marginTop: 4 }}>
            A little space, often.
          </AppText>
          <AppText muted style={{ marginTop: 4 }}>
            A simple view of your recent activity.
          </AppText>
        </View>
        <ProgressRing progress={Math.min(1, sessions / 7)} size={72} />
      </View>
      <View style={styles.stats}>
        <Stat label="Sessions" value={String(sessions)} />
        <Stat label="Minutes" value={String(minutes)} />
        <Stat label="Reflections" value={String(reflections)} />
      </View>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" muted>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.xl },
  header: { flexDirection: "row", alignItems: "center" },
  stats: { marginTop: spacing.xl, flexDirection: "row", gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.ivory,
    borderRadius: 14,
    padding: spacing.md,
  },
});
