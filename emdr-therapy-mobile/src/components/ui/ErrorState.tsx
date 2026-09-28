import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { colors, spacing } from "../../theme/tokens";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  onSecondary,
  secondaryLabel,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <AppText style={{ color: colors.danger, fontWeight: "800" }}>!</AppText>
      </View>
      <AppText variant="h3">{title}</AppText>
      <AppText muted style={styles.message}>
        {message}
      </AppText>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} /> : null}
      {onSecondary && secondaryLabel ? (
        <Button label={secondaryLabel} onPress={onSecondary} variant="quiet" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dangerPale,
    justifyContent: "center",
    alignItems: "center",
  },
  message: { maxWidth: 310, textAlign: "center" },
});
