import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Chip } from "../ui/Chip";
import { colors, spacing } from "../../theme/tokens";

export function VisualSettingsPanel({
  enabled,
  mode,
  onMode,
}: {
  enabled: boolean;
  mode: "soft-orb" | "horizontal-line" | "minimal-dot";
  onMode: (mode: "soft-orb" | "horizontal-line" | "minimal-dot") => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="bodyStrong">Visual cue</AppText>
        <AppText
          variant="caption"
          style={{ color: enabled ? colors.forest : colors.mist }}
        >
          {enabled ? "On" : "Off"}
        </AppText>
      </View>
      <View style={styles.chips}>
        <Chip
          label="Soft Orb"
          selected={mode === "soft-orb"}
          onPress={() => onMode("soft-orb")}
        />
        <Chip
          label="Horizontal"
          selected={mode === "horizontal-line"}
          onPress={() => onMode("horizontal-line")}
        />
        <Chip
          label="Minimal"
          selected={mode === "minimal-dot"}
          onPress={() => onMode("minimal-dot")}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: "row", justifyContent: "space-between" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
