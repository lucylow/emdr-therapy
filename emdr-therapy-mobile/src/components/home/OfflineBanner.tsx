import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, radii, spacing } from "../../theme/tokens";

export function OfflineBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open offline status"
      onPress={onPress}
      style={styles.banner}
    >
      <Icon name="cloud-offline-outline" size={20} color={colors.warm} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{"You're offline"}</AppText>
        <AppText variant="caption" muted>
          Local sessions remain available.
        </AppText>
      </View>
      <Icon name="chevron-forward" size={18} color={colors.mist} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warmPale,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
