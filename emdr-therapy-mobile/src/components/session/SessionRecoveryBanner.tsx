import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "../ui/Button";
import { AppText } from "../ui/AppText";
import { InlineStatus } from "../ui/InlineStatus";
import { colors, spacing } from "../../theme/tokens";

export function SessionRecoveryBanner({
  onResume,
  onDiscard,
}: {
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <View style={styles.banner}>
      <InlineStatus label="Session saved locally" tone="success" />
      <AppText variant="h3" style={{ marginTop: spacing.md }}>
        Resume your previous session?
      </AppText>
      <AppText muted style={{ marginTop: spacing.sm }}>
        The app found a session that was interrupted. Nothing will continue
        until you choose Resume.
      </AppText>
      <View style={styles.actions}>
        <Button label="Resume" onPress={onResume} style={{ flex: 1 }} />
        <Button
          label="Discard"
          onPress={onDiscard}
          variant="secondary"
          style={{ width: 100 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.silk,
    borderRadius: 20,
    padding: spacing.xl,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
});
