import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, radii, spacing } from "../../theme/tokens";

export function ValueSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [width, setWidth] = useState(1);
  const ratio = (Math.min(max, Math.max(min, value)) - min) / (max - min);

  const handleLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.max(1, event.nativeEvent.layout.width));
  const setFromLocation = (location: number) => {
    const raw =
      min + (Math.min(width, Math.max(0, location)) / width) * (max - min);
    const rounded = Math.round(raw / step) * step;
    onChange(Math.min(max, Math.max(min, rounded)));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" muted>
          {Math.round(value)}%
        </AppText>
      </View>

      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        onLayout={handleLayout}
        onPress={(event) => setFromLocation(event.nativeEvent.locationX)}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        <View style={[styles.thumb, { left: `${ratio * 100}%` }]} />
      </Pressable>

      <View style={styles.buttons}>
        <Pressable
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => onChange(Math.max(min, value - step))}
          style={styles.smallButton}
        >
          <AppText style={styles.buttonText}>−</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={`Increase ${label}`}
          onPress={() => onChange(Math.min(max, value + step))}
          style={styles.smallButton}
        >
          <AppText style={styles.buttonText}>+</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  track: {
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.silk,
    overflow: "hidden",
    marginTop: spacing.md,
    justifyContent: "center",
  },
  fill: { height: "100%", backgroundColor: colors.forest, borderRadius: 9 },
  thumb: {
    position: "absolute",
    top: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.forest,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: 6,
  },
  smallButton: {
    minWidth: 34,
    minHeight: 30,
    borderRadius: radii.sm,
    backgroundColor: colors.cloud,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 18, lineHeight: 20 },
});
