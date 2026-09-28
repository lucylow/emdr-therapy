import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { ProgressRing } from "../session/ProgressRing";
import { colors, spacing } from "../../theme/tokens";

export function ContinueCard({
  title,
  duration,
  progress,
  onContinue,
}: {
  title: string;
  duration: number;
  progress: number;
  onContinue: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <AppText variant="overline" style={{ color: colors.forestLight }}>
            CONTINUE
          </AppText>
          <AppText variant="h2" style={{ color: colors.white, marginTop: 4 }}>
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: "#B5B5BA", marginTop: 4 }}>
            {duration} min • Audio + Visual
          </AppText>
        </View>
        <ProgressRing progress={progress} />
      </View>
      <Button
        label="Continue Session"
        onPress={onContinue}
        variant="secondary"
        style={{ marginTop: spacing.lg }}
      />
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: colors.graphite },
  top: { flexDirection: "row", alignItems: "center" },
});
