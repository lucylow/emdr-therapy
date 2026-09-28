import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors, layout } from "../../theme/tokens";
import { Icon, type IconName } from "./Icon";

export function IconButton({
  icon,
  onPress,
  label,
  size = 44,
  tone = "default",
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  tone?: "default" | "inverse" | "danger";
}) {
  const foreground =
    tone === "inverse"
      ? colors.white
      : tone === "danger"
        ? colors.danger
        : colors.graphite;
  const background =
    tone === "inverse" ? "rgba(255,255,255,0.08)" : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Icon name={icon} color={foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: layout.touchTarget,
    minHeight: layout.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
});
