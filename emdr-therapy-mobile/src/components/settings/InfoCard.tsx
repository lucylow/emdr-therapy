import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon, type IconName } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function InfoCard({
  icon,
  title,
  body,
  tone = "forest",
}: {
  icon: IconName;
  title: string;
  body: string;
  tone?: "forest" | "warm" | "lavender";
}) {
  const palette =
    tone === "forest"
      ? { fg: colors.forest, bg: colors.forestPale }
      : tone === "warm"
        ? { fg: colors.warm, bg: colors.warmPale }
        : { fg: colors.lavender, bg: colors.lavenderPale };
  return (
    <View style={[styles.card, { backgroundColor: palette.bg }]}>
      <View style={[styles.icon, { backgroundColor: colors.white }]}>
        <Icon name={icon} size={19} color={palette.fg} />
      </View>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText muted style={{ marginTop: spacing.sm }}>
        {body}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
});
