import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { colors, spacing } from "../../theme/tokens";

export function SessionPauseOverlay({
  visible,
  elapsed,
  onResume,
  onEnd,
}: {
  visible: boolean;
  elapsed: string;
  onResume: () => void;
  onEnd: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <AppText variant="overline" style={{ color: colors.forest }}>
          SESSION PAUSED
        </AppText>
        <AppText variant="display" style={{ marginTop: spacing.sm }}>
          Take your time.
        </AppText>
        <AppText muted style={{ marginTop: spacing.sm }}>
          Your progress is saved at {elapsed}. {"Resume whenever you're ready."}
        </AppText>
        <Button
          label="Resume Session"
          onPress={onResume}
          style={{ marginTop: spacing.xl }}
        />
        <Button label="End Session" onPress={onEnd} variant="quiet" />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(28,28,30,0.94)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 24,
  },
});
