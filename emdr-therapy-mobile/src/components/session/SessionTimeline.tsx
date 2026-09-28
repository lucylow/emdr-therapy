import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function SessionTimeline({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const active = index === current;
        const complete = index < current;
        return (
          <View key={step} style={styles.step}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    complete || active ? colors.forest : colors.silk,
                },
              ]}
            >
              <AppText
                variant="caption"
                style={{
                  color: complete || active ? colors.white : colors.mist,
                  fontSize: 9,
                }}
              >
                {index + 1}
              </AppText>
            </View>
            <AppText
              variant="caption"
              style={{ color: active ? colors.graphite : colors.mist }}
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
  step: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
