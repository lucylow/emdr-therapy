import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";
import type { Session } from "../../data/mock";

export function SessionCard({
  session,
  onPress,
}: {
  session: Session;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`Open ${session.title}`}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Icon
            name={
              session.format === "Visual" ? "eye-outline" : "headset-outline"
            }
            size={20}
            color={colors.forest}
          />
        </View>
        {session.favorite ? (
          <Icon name="heart" size={17} color={colors.lavender} />
        ) : null}
      </View>
      <AppText variant="h3" style={{ marginTop: spacing.lg }}>
        {session.title}
      </AppText>
      <AppText variant="caption" muted style={{ marginTop: 4 }}>
        {session.duration} min • {session.format} • {session.intensity}
      </AppText>
      <AppText style={{ marginTop: spacing.sm }} muted>
        {session.description}
      </AppText>
    </Card>
  );
}
const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between" },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
});
