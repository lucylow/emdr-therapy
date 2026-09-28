import React from "react";
import { View, StyleSheet } from "react-native";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { colors, spacing } from "../../theme/tokens";

export function LoadingPanel() {
  return (
    <View accessibilityLabel="Loading panel" style={styles.panel}>
      <LoadingSkeleton width={110} height={12} />
      <LoadingSkeleton width="100%" height={72} radius={16} />
      <LoadingSkeleton width="68%" height={16} />
      <LoadingSkeleton width="48%" height={16} />
    </View>
  );
}
const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    gap: spacing.md,
  },
});
