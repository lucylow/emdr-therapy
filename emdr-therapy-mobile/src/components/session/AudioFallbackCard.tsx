import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

export function AudioFallbackCard({
  onRetry,
  onContinue,
}: {
  onRetry: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Icon name="volume-mute-outline" color={colors.warm} />
      </View>
      <AppText variant="h3">{"We couldn't start the audio."}</AppText>
      <AppText muted style={{ marginTop: 6 }}>
        You can retry, adjust the output, or continue with the visual
        experience.
      </AppText>
      <View style={styles.actions}>
        <Button label="Retry Audio" onPress={onRetry} style={{ flex: 1 }} />
        <Button
          label="Continue Visually"
          onPress={onContinue}
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.warmPale, borderRadius: 20, padding: 20 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 18 },
});
