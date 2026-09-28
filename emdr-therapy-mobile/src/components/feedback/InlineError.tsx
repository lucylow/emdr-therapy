import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/tokens";

export function InlineError({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.row}>
      <View style={styles.icon}>
        <AppText style={{ color: colors.danger, fontWeight: "800" }}>!</AppText>
      </View>
      <AppText variant="caption" style={{ color: colors.danger, flex: 1 }}>
        {message}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.dangerPale,
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
