import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors, radii } from "../../theme/tokens";

export function LoadingSkeleton({
  width = "100%",
  height = 18,
  radius = radii.sm,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible
      accessibilityLabel="Loading"
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: colors.silk,
        opacity,
      }}
    />
  );
}
