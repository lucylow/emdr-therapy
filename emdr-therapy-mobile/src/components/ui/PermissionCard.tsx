import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "./Button";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";
import { colors, spacing } from "../../theme/tokens";

export function PermissionCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name={icon} color={colors.forest} />
      </View>
      <AppText variant="h3">{title}</AppText>
      <AppText muted style={{ marginTop: spacing.sm }}>
        {description}
      </AppText>
      <Button
        label={actionLabel}
        onPress={onAction}
        variant="secondary"
        style={{ marginTop: spacing.lg }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.forestPale,
    borderRadius: 20,
    padding: spacing.xl,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
});
