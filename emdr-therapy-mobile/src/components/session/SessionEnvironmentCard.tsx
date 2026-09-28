import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function SessionEnvironmentCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Icon name="moon-outline" color={colors.forest} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">Evening environment</AppText>
          <AppText variant="caption" muted style={{ marginTop: 3 }}>
            Soft visual intensity • moderate device volume
          </AppText>
        </View>
      </View>
      <AppText variant="caption" muted style={{ marginTop: spacing.lg }}>
        Representative recommendation based on the current demo profile.
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.ivory, borderRadius: 18, padding: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
