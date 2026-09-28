import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText
        variant="overline"
        style={{ color: colors.mist, marginLeft: 4, marginBottom: spacing.sm }}
      >
        {title}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.silk,
  },
});
