import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "../ui/Button";
import { AppText } from "../ui/AppText";
import { Waveform } from "../session/Waveform";
import { colors, spacing } from "../../theme/tokens";

export function RecordingControl({
  recording,
  onToggle,
  duration = "00:18",
}: {
  recording: boolean;
  onToggle: () => void;
  duration?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="bodyStrong">Optional voice note</AppText>
        {recording ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            ● {duration}
          </AppText>
        ) : (
          <AppText variant="caption" muted>
            Off
          </AppText>
        )}
      </View>
      {recording ? <Waveform progress={0.32} active reducedMotion /> : null}
      <Button
        label={recording ? "Stop recording" : "Start recording"}
        variant={recording ? "danger" : "secondary"}
        onPress={onToggle}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
