import React from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radii, shadows, spacing } from "../../theme/tokens";

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={[styles.base, style]}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        style,
        { opacity: pressed ? 0.92 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.card,
  },
});
