import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { colors, spacing } from "../../theme/tokens";

export function NetworkNotice({
  offline,
  onRetry,
}: {
  offline: boolean;
  onRetry?: () => void;
}) {
  if (!offline) return null;
  return (
    <View style={styles.banner}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{"You're offline"}</AppText>
        <AppText variant="caption" muted style={{ marginTop: 3 }}>
          Local session data can remain available while network requests wait.
        </AppText>
      </View>
      {onRetry ? (
        <Button
          label="Retry"
          variant="secondary"
          onPress={onRetry}
          style={{ minHeight: 42 }}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.warmPale,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
