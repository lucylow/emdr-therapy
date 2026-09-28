import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors } from "../../theme/tokens";

export function ConnectivityBadge({
  online,
  pending = 0,
}: {
  online: boolean;
  pending?: number;
}) {
  const label = online
    ? pending
      ? `Syncing ${pending}`
      : "Online"
    : "Offline";
  const fg = online ? colors.forest : colors.warm;
  const bg = online ? colors.forestPale : colors.warmPale;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Icon
        name={online ? "cloud-done-outline" : "cloud-offline-outline"}
        color={fg}
        size={14}
      />
      <AppText variant="caption" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
});
