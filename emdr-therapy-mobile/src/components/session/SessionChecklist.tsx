import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Icon } from "../ui/Icon";
import { colors, spacing } from "../../theme/tokens";

const DEFAULT_STEPS = [
  "Choose a session",
  "Review audio and visual settings",
  "Begin when you are ready",
  "Pause or stop at any time",
  "Optionally reflect afterward",
];

export function SessionChecklist({ completed = 2 }: { completed?: number }) {
  return (
    <View style={styles.container}>
      {DEFAULT_STEPS.map((step, index) => {
        const done = index < completed;
        return (
          <View key={step} style={styles.row}>
            <View
              style={[
                styles.circle,
                { backgroundColor: done ? colors.forest : colors.cloud },
              ]}
            >
              <Icon
                name={done ? "checkmark" : "ellipse-outline"}
                size={14}
                color={done ? colors.white : colors.mist}
              />
            </View>
            <AppText
              variant="caption"
              style={{ color: done ? colors.graphite : colors.graphiteSoft }}
            >
              {step}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
