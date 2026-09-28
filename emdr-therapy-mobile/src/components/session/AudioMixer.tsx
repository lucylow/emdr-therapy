import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { ValueSlider } from "./ValueSlider";
import { colors, spacing } from "../../theme/tokens";

export function AudioMixer({
  voice,
  ambient,
  cue,
  onVoice,
  onAmbient,
  onCue,
}: {
  voice: number;
  ambient: number;
  cue: number;
  onVoice: (value: number) => void;
  onAmbient: (value: number) => void;
  onCue: (value: number) => void;
}) {
  return (
    <View>
      <View style={styles.titleRow}>
        <AppText variant="h3">Sound balance</AppText>
        <AppText variant="caption" muted>
          Adjust anytime
        </AppText>
      </View>
      <ValueSlider label="Guided voice" value={voice} onChange={onVoice} />
      <ValueSlider label="Ambient" value={ambient} onChange={onAmbient} />
      <ValueSlider label="Focus cue" value={cue} onChange={onCue} />
      <View style={styles.note}>
        <AppText variant="caption" muted>
          Tip: keep the mix comfortable for your device and environment.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  note: {
    backgroundColor: colors.ivory,
    borderRadius: 12,
    padding: 12,
    marginTop: spacing.lg,
  },
});
