import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, radii, spacing } from "../../theme/tokens";

export function Chip({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? colors.forestPale : colors.white,
          borderColor: selected ? colors.forest : colors.silk,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <AppText
        variant="caption"
        style={{ color: selected ? colors.forest : colors.graphiteSoft }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
