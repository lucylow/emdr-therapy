import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, spacing } from "../../theme/tokens";

export function ScreenHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText
            variant="overline"
            style={{ color: colors.forest, marginBottom: 5 }}
          >
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="h1">{title}</AppText>
        {description ? (
          <AppText muted style={{ marginTop: spacing.sm, maxWidth: 350 }}>
            {description}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
  },
  copy: { flex: 1 },
});
