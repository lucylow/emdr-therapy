import React from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function AudioProgressBar({
  progress,
  onSeek,
}: {
  progress: number;
  onSeek: (progress: number) => void;
}) {
  const safe = Math.max(0, Math.min(1, progress));
  return (
    <View>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Audio progress"
        onPress={(event) => {
          const width = event.nativeEvent.locationX;
          onSeek(Math.max(0, Math.min(1, width / 260)));
        }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${safe * 100}%` }]} />
        <View style={[styles.thumb, { left: `${safe * 100}%` }]} />
      </Pressable>
      <View style={styles.time}>
        <AppText variant="caption" muted>
          00:00
        </AppText>
        <AppText variant="caption" muted>
          12:00
        </AppText>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  track: {
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.silk,
    justifyContent: "center",
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.forest },
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
  time: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
});
