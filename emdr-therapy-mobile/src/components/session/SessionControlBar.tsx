import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";
import { spacing } from "../../theme/tokens";

export function SessionControlBar({
  playing,
  onToggle,
  onEnd,
  onSettings,
}: {
  playing: boolean;
  onToggle: () => void;
  onEnd: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.row}>
      <IconButton
        icon="options-outline"
        label="Session settings"
        tone="inverse"
        onPress={onSettings}
      />
      <View style={{ flex: 1 }}>
        <Button label={playing ? "Pause" : "Resume"} onPress={onToggle} />
      </View>
      <IconButton
        icon="stop"
        label="End session"
        tone="inverse"
        onPress={onEnd}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
