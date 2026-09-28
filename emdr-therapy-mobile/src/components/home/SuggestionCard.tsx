import React from "react";
import { View, StyleSheet } from "react-native";
import { Pressable } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, radii, spacing } from "../../theme/tokens";

export function SuggestionCard({
  title,
  subtitle,
  duration,
  icon = "sparkles-outline",
  onPress,
}: {
  title: string;
  subtitle: string;
  duration: number;
  icon?: React.ComponentProps<typeof Icon>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${duration} minutes`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.86 : 1 }]}
    >
      <View style={styles.icon}>
        <Icon name={icon} size={19} color={colors.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" muted style={{ marginTop: 3 }}>
          {subtitle}
        </AppText>
      </View>
      <AppText variant="caption" style={{ color: colors.forest }}>
        {duration} min
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.silk,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
});
