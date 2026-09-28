import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/tokens";

export function SessionCompletionAnimation({
  reducedMotion = false,
}: {
  reducedMotion?: boolean;
}) {
  const scale = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (reducedMotion) {
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }
    const animation = Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, scale, opacity]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ scale }], opacity }]}
    >
      <View style={styles.outer}>
        <View style={styles.inner}>
          <AppText
            style={{ color: colors.white, fontSize: 30, fontWeight: "800" }}
          >
            ✓
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center" },
  outer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
});
