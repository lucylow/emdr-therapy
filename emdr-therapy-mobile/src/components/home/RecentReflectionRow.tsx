import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function RecentReflectionRow({
  title,
  date,
  preview,
  onPress,
}: {
  title: string;
  date: string;
  preview: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open reflection from ${date}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.icon}>
        <Icon name="book-outline" size={18} color={colors.forest} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" muted style={{ marginTop: 3 }}>
          {date}
        </AppText>
        <AppText
          variant="caption"
          muted
          style={{ marginTop: 3 }}
          numberOfLines={2}
        >
          {preview}
        </AppText>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.mist} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
});
