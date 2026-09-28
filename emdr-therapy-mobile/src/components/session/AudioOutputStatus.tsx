import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function AudioOutputStatus({
  output,
  volume,
  available = true,
}: {
  output: "iPhone Speaker" | "Headphones" | "Bluetooth" | "Unknown";
  volume: number;
  available?: boolean;
}) {
  const icon =
    output === "Headphones"
      ? "headset-outline"
      : output === "Bluetooth"
        ? "bluetooth-outline"
        : "volume-high-outline";

  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Icon
          name={icon}
          size={18}
          color={available ? colors.forest : colors.danger}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">
          {available ? output : "Audio unavailable"}
        </AppText>
        <AppText variant="caption" muted>
          {available
            ? `Volume ${Math.round(volume)}%`
            : "Try another output or continue visually"}
        </AppText>
      </View>
      <View
        style={[
          styles.dot,
          { backgroundColor: available ? colors.grow : colors.danger },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cloud,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
