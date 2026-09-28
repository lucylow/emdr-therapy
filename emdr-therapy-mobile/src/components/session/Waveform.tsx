import React, { useEffect, useMemo, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { WAVEFORM_HEIGHTS } from "../../data/mock";
import { colors, spacing } from "../../theme/tokens";

export function Waveform({
  progress = 0,
  active = false,
  reducedMotion = false,
  light = false,
}: {
  progress?: number;
  active?: boolean;
  reducedMotion?: boolean;
  light?: boolean;
}) {
  const anims = useRef(
    WAVEFORM_HEIGHTS.map(() => new Animated.Value(1)),
  ).current;
  useEffect(() => {
    if (!active || reducedMotion) return;
    const running = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(a, {
            toValue: 0.65 + (i % 4) * 0.08,
            duration: 360 + (i % 5) * 80,
            useNativeDriver: true,
          }),
          Animated.timing(a, {
            toValue: 1,
            duration: 360 + ((i + 2) % 5) * 80,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    running.forEach((x) => x.start());
    return () => running.forEach((x) => x.stop());
  }, [active, reducedMotion, anims]);
  const bars = useMemo(() => WAVEFORM_HEIGHTS, []);
  return (
    <View
      accessible
      accessibilityLabel={`Audio waveform, ${Math.round(progress * 100)} percent complete`}
      style={styles.container}
    >
      {bars.map((height, index) => {
        const selected = index / bars.length <= progress;
        return (
          <Animated.View
            key={`${index}-${height}`}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: selected
                  ? light
                    ? colors.forestLight
                    : colors.forest
                  : light
                    ? "#3A3A3C"
                    : colors.silk,
                transform: [{ scaleY: anims[index] }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
  },
  bar: { width: 3, borderRadius: 2 },
});
