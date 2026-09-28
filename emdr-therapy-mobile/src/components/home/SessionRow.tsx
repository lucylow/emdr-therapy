import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function SessionRow({
  title,
  subtitle,
  duration,
  completed = true,
  onPress,
}: {
  title: string;
  subtitle: string;
  duration: number;
  completed?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${duration} minutes`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.icon}>
        <Icon
          name={completed ? "checkmark" : "play"}
          size={17}
          color={completed ? colors.forest : colors.graphite}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" muted>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="caption" muted>
        {duration} min
      </AppText>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
});
