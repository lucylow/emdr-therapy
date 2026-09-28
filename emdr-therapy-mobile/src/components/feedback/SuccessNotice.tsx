import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/tokens";

export function SuccessNotice({ message }: { message: string }) {
  return (
    <View accessibilityRole="text" style={styles.row}>
      <View style={styles.icon}>
        <AppText style={{ color: colors.grow, fontWeight: "800" }}>✓</AppText>
      </View>
      <AppText variant="caption" style={{ color: colors.grow, flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.growPale,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
