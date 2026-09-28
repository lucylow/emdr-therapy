import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, spacing } from "../../theme/tokens";

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="h3">{title}</AppText>
      {action ? (
        <AppText
          variant="caption"
          onPress={onAction}
          style={{ color: colors.forest }}
        >
          {action}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
});
