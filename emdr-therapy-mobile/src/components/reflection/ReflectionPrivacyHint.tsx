import React from "react";
import { View, StyleSheet } from "react-native";
import { Icon } from "../ui/Icon";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function ReflectionPrivacyHint() {
  return (
    <View style={styles.row}>
      <Icon name="lock-closed-outline" size={17} color={colors.forest} />
      <AppText variant="caption" muted style={{ flex: 1 }}>
        Reflection notes are sensitive personal content. Keep them private and
        review sharing controls before export.
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.forestPale,
    borderRadius: 14,
    padding: 12,
  },
});
