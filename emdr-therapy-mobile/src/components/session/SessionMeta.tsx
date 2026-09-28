import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function SessionMeta({
  duration,
  format,
  intensity,
}: {
  duration: number;
  format: string;
  intensity: string;
}) {
  return (
    <View style={styles.row}>
      <Meta label="Duration" value={`${duration} min`} />
      <Meta label="Format" value={format} />
      <Meta label="Intensity" value={intensity} />
    </View>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="caption" style={{ marginTop: 3 }}>
        {value}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm },
  meta: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.silk,
  },
});
