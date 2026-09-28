import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { colors } from "../../theme/tokens";

export function VisualOrb({
  active,
  reducedMotion = false,
  intensity = 35,
  mode = "soft-orb",
}: {
  active: boolean;
  reducedMotion?: boolean;
  intensity?: number;
  mode?: "soft-orb" | "horizontal-line" | "minimal-dot";
}) {
  const shift = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active || reducedMotion) {
      shift.stopAnimation();
      scale.stopAnimation();
      return;
    }
    const move = Animated.loop(
      Animated.sequence([
        Animated.timing(shift, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shift, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );
    move.start();
    breathe.start();
    return () => {
      move.stop();
      breathe.stop();
    };
  }, [active, reducedMotion, shift, scale]);

  const translateX = shift.interpolate({
    inputRange: [0, 1],
    outputRange: [-108, 108],
  });
  const opacity = 0.42 + Math.min(60, Math.max(0, intensity)) / 160;

  if (mode === "horizontal-line")
    return (
      <View
        style={styles.lineTrack}
        accessible
        accessibilityLabel="Horizontal visual focus cue"
      >
        <View style={styles.line} />
        <Animated.View
          style={[
            styles.lineDot,
            { opacity, transform: [{ translateX }, { scale: scale }] },
          ]}
        />
      </View>
    );
  if (mode === "minimal-dot")
    return (
      <View
        style={styles.dotTrack}
        accessible
        accessibilityLabel="Minimal visual focus cue"
      >
        <Animated.View
          style={[styles.dot, { opacity, transform: [{ scale: scale }] }]}
        />
      </View>
    );
  return (
    <View
      style={styles.orbTrack}
      accessible
      accessibilityLabel="Soft visual focus cue"
    >
      <Animated.View
        style={[
          styles.orb,
          { opacity, transform: [{ translateX }, { scale: scale }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orbTrack: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  orb: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.forestLight,
    shadowColor: colors.forest,
    shadowOpacity: 0.24,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  lineTrack: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  line: {
    position: "absolute",
    width: "72%",
    height: 2,
    backgroundColor: "#3A3A3C",
  },
  lineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lavender,
    shadowColor: colors.lavender,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  dotTrack: { height: 170, alignItems: "center", justifyContent: "center" },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lavenderSoft,
  },
});
