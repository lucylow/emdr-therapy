import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/tokens";

export function TopStatusBar() {
  return (
    <View style={styles.container}>
      <AppText variant="overline" style={{ color: colors.graphiteSoft }}>
        EMDR FLOW AI
      </AppText>
      <AppText variant="caption" muted>
        Private
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
