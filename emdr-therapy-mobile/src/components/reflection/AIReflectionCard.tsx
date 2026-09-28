import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function AIReflectionCard({ text }: { text: string }) {
  return (
    <Card style={{ backgroundColor: colors.lavenderPale }}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name="sparkles-outline" color={colors.lavender} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">AI Reflection</AppText>
          <AppText variant="caption" muted>
            AI-generated, descriptive only
          </AppText>
        </View>
      </View>
      <AppText style={{ marginTop: spacing.lg }}>{text}</AppText>
      <AppText variant="caption" muted style={{ marginTop: spacing.md }}>
        Not a diagnosis or medical assessment.
      </AppText>
    </Card>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
