import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { colors, spacing } from "../../theme/tokens";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <AppText style={{ fontSize: 26 }}>○</AppText>
      </View>
      <AppText variant="h3" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      <AppText
        muted
        style={{ marginTop: spacing.sm, textAlign: "center", maxWidth: 320 }}
      >
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: spacing.xl, minWidth: 190 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: spacing.huge },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
