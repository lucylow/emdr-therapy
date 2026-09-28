import React from "react";
import { View, StyleSheet } from "react-native";
import { Chip } from "../ui/Chip";
import { AppText } from "../ui/AppText";
import { spacing } from "../../theme/tokens";

export function VisualModeSelector({
  value,
  onChange,
}: {
  value: "soft-orb" | "horizontal-line" | "minimal-dot";
  onChange: (value: "soft-orb" | "horizontal-line" | "minimal-dot") => void;
}) {
  return (
    <View>
      <AppText variant="h3">Visual mode</AppText>
      <View style={styles.row}>
        <Chip
          label="Soft Orb"
          selected={value === "soft-orb"}
          onPress={() => onChange("soft-orb")}
        />
        <Chip
          label="Horizontal"
          selected={value === "horizontal-line"}
          onPress={() => onChange("horizontal-line")}
        />
        <Chip
          label="Minimal"
          selected={value === "minimal-dot"}
          onPress={() => onChange("minimal-dot")}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
