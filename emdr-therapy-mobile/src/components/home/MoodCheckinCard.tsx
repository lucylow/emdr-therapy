import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function MoodCheckinCard({
  before,
  after,
}: {
  before: number;
  after?: number;
}) {
  const final = after ?? before;
  const difference = after === undefined ? 0 : after - before;

  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">Self-reported check-in</AppText>
          <AppText variant="caption" muted style={{ marginTop: 3 }}>
            Your own selections, shown descriptively.
          </AppText>
        </View>
        <AppText
          variant="h3"
          style={{ color: difference > 0 ? colors.grow : colors.graphite }}
        >
          {difference > 0 ? `+${difference}` : difference}
        </AppText>
      </View>

      <View style={styles.scale}>
        <View style={styles.scaleTrack}>
          <View style={[styles.scaleBefore, { left: `${before * 10}%` }]} />
          {after !== undefined && (
            <View style={[styles.scaleAfter, { left: `${final * 10}%` }]} />
          )}
          {after !== undefined && (
            <View
              style={[
                styles.connector,
                {
                  left: `${Math.min(before, after) * 10}%`,
                  width: `${Math.abs(after - before) * 10}%`,
                },
              ]}
            />
          )}
        </View>
      </View>

      <View style={styles.labels}>
        <AppText variant="caption" muted>
          Before {before}/10
        </AppText>
        <AppText variant="caption" muted>
          {after === undefined
            ? "Waiting for after check-in"
            : `After ${after}/10`}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center" },
  scale: { marginTop: spacing.xl, height: 24, justifyContent: "center" },
  scaleTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cloud,
    position: "relative",
  },
  scaleBefore: {
    position: "absolute",
    width: 14,
    height: 14,
    marginTop: -3,
    borderRadius: 7,
    backgroundColor: colors.mist,
  },
  scaleAfter: {
    position: "absolute",
    width: 14,
    height: 14,
    marginTop: -3,
    borderRadius: 7,
    backgroundColor: colors.forest,
    zIndex: 2,
  },
  connector: {
    position: "absolute",
    top: 0,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.forestPale,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
});
