import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { AppText } from "./AppText";
import { colors, layout, radii, spacing } from "../../theme/tokens";

type Variant = "primary" | "secondary" | "quiet" | "danger";

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  const foreground =
    variant === "primary" || variant === "danger"
      ? colors.white
      : colors.graphite;
  const background =
    variant === "primary"
      ? colors.forest
      : variant === "danger"
        ? colors.danger
        : variant === "secondary"
          ? colors.white
          : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background,
          borderColor: variant === "secondary" ? colors.silk : "transparent",
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <AppText variant="bodyStrong" style={{ color: foreground }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minButtonHeight,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
