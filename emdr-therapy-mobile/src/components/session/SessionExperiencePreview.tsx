import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { Waveform } from "./Waveform";
import { VisualOrb } from "./VisualOrb";
import { colors, spacing } from "../../theme/tokens";

export function SessionExperiencePreview() {
  const [playing, setPlaying] = useState(true);
  const [visual, setVisual] = useState(true);
  const [progress, setProgress] = useState(0.64);
  const displayProgress = useMemo(
    () => `${Math.round(progress * 100)}%`,
    [progress],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText variant="overline" style={{ color: colors.forestLight }}>
            LIVE PREVIEW
          </AppText>
          <AppText variant="h2" style={{ color: colors.white, marginTop: 4 }}>
            Evening Reset
          </AppText>
        </View>
        <AppText variant="caption" style={{ color: "#AAAAB0" }}>
          {displayProgress}
        </AppText>
      </View>

      <View style={styles.visual}>
        {visual ? (
          <VisualOrb active={playing} reducedMotion={!playing} intensity={35} />
        ) : (
          <AppText style={{ color: "#A8A8AD" }}>Visual off</AppText>
        )}
      </View>

      <Waveform progress={progress} active={playing} light />

      <View style={styles.meta}>
        <AppText variant="caption" style={{ color: "#A6A6AC" }}>
          07:42 / 12:00
        </AppText>
        <AppText variant="caption" style={{ color: colors.forestLight }}>
          Audio + Visual
        </AppText>
      </View>

      <View style={styles.actions}>
        <Button
          label={playing ? "Pause" : "Play"}
          onPress={() => setPlaying((v) => !v)}
          variant="secondary"
          style={{ flex: 1 }}
        />
        <Button
          label={visual ? "Visual On" : "Visual Off"}
          onPress={() => setVisual((v) => !v)}
          variant="secondary"
          style={{ flex: 1 }}
        />
        <Button
          label="Next"
          onPress={() => setProgress((v) => Math.min(1, v + 0.08))}
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.graphite, borderRadius: 26, padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  visual: {
    height: 170,
    borderRadius: 22,
    backgroundColor: "#222225",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 14 },
});
