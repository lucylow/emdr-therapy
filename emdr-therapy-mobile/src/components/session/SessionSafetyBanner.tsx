import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function SessionSafetyBanner() {
  return (
    <View
      style={styles.banner}
      accessible
      accessibilityLabel="Session controls and safety notice"
    >
      <Icon name="information-circle-outline" size={20} color={colors.forest} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">You stay in control.</AppText>
        <AppText variant="caption" muted style={{ marginTop: 3 }}>
          Pause, resume, or end the session whenever you choose.
        </AppText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.forestPale,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
