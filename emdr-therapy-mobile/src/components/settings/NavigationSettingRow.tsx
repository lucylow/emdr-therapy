import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon, type IconName } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function NavigationSettingRow({
  icon,
  title,
  value,
  onPress,
}: {
  icon: IconName;
  title: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${value ? `, ${value}` : ""}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={styles.left}>
        <View style={styles.icon}>
          <Icon name={icon} size={18} color={colors.forest} />
        </View>
        <AppText variant="bodyStrong">{title}</AppText>
      </View>
      <View style={styles.right}>
        {value ? (
          <AppText variant="caption" muted>
            {value}
          </AppText>
        ) : null}
        <Icon name="chevron-forward" size={18} color={colors.mist} />
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
});
