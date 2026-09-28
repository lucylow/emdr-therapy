import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function FilterSummary({
  count,
  filter,
}: {
  count: number;
  filter: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="caption" muted>
        {count} experiences
      </AppText>
      <AppText variant="caption" style={{ color: colors.forest }}>
        {filter}
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
