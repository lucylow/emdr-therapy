import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { colors, spacing } from "../../theme/tokens";

export function OfflineRecoveryCard({
  onContinue,
  onRetry,
}: {
  onContinue: () => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.card}>
      <AppText variant="h3">Continue without a connection</AppText>
      <AppText muted style={{ marginTop: 6 }}>
        You can continue with the local experience and retry syncing later.
      </AppText>
      <View style={styles.actions}>
        <Button
          label="Continue Offline"
          onPress={onContinue}
          style={{ flex: 1 }}
        />
        <Button
          label="Retry"
          variant="secondary"
          onPress={onRetry}
          style={{ width: 92 }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.warmPale, borderRadius: 20, padding: 20 },
  actions: { flexDirection: "row", gap: 8, marginTop: 18 },
});
