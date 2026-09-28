import React from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon, type IconName } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function SettingRow({
  title,
  subtitle,
  icon,
  value,
  onValueChange,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
}) {
  const body = (
    <>
      <View style={styles.left}>
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={18} color={colors.forest} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" muted style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {onValueChange ? (
        <Switch
          accessibilityLabel={title}
          value={Boolean(value)}
          onValueChange={onValueChange}
          trackColor={{ false: colors.silk, true: colors.forestLight }}
          thumbColor={colors.white}
        />
      ) : (
        <Icon name="chevron-forward" color={colors.mist} size={19} />
      )}
    </>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      {body}
    </Pressable>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
