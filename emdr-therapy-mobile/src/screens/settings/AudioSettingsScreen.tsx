import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { AppText } from "../../components/ui/AppText";
import { VisualSettingsPanel } from "../../components/session/VisualSettingsPanel";
import { ValueSlider } from "../../components/session/ValueSlider";
import { AUDIO_TRACKS } from "../../data/mock";
import { useAppState } from "../../state/AppStateProvider";
import { colors, spacing } from "../../theme/tokens";

export function AudioSettingsScreen() {
  const router = useRouter();
  const { preferences, updateAudio, setPreferences } = useAppState();
  const setVisualMode = async (
    mode: "soft-orb" | "horizontal-line" | "minimal-dot",
  ) =>
    setPreferences({ ...preferences, visual: { ...preferences.visual, mode } });
  const setVisualIntensity = async (value: number) =>
    setPreferences({
      ...preferences,
      visual: { ...preferences.visual, intensity: value },
    });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenHeader
        eyebrow="AUDIO & VISUAL"
        title="Shape the experience."
        description="Adjust the sound and visual layers around your comfort."
      />

      <Card>
        <AppText variant="h3">Sound</AppText>
        <AppText variant="caption" muted style={{ marginTop: 4 }}>
          Soft Focus • {preferences.audio.masterVolume}%
        </AppText>
        <ValueSlider
          label="Voice"
          value={preferences.audio.voiceLevel}
          onChange={(value) => void updateAudio({ voiceLevel: value })}
        />
        <ValueSlider
          label="Ambient"
          value={preferences.audio.ambientLevel}
          onChange={(value) => void updateAudio({ ambientLevel: value })}
        />
        <ValueSlider
          label="Focus cue"
          value={preferences.audio.cueLevel}
          onChange={(value) => void updateAudio({ cueLevel: value })}
        />
        <ValueSlider
          label="Master volume"
          value={preferences.audio.masterVolume}
          onChange={(value) => void updateAudio({ masterVolume: value })}
        />
      </Card>

      <Card>
        <AppText variant="h3">Sound source</AppText>
        <View style={styles.trackList}>
          {AUDIO_TRACKS.map((track) => (
            <Button
              key={track.id}
              label={`${track.title} • ${Math.round(track.duration / 60)} min`}
              variant={
                preferences.audio.selectedTrackId === track.id
                  ? "primary"
                  : "secondary"
              }
              onPress={() => void updateAudio({ selectedTrackId: track.id })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <VisualSettingsPanel
          enabled={preferences.visual.enabled}
          mode={preferences.visual.mode}
          onMode={setVisualMode}
        />
        <ValueSlider
          label="Visual intensity"
          value={preferences.visual.intensity}
          onChange={setVisualIntensity}
        />
      </Card>

      <Button label="Done" onPress={() => router.back()} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: 20,
    backgroundColor: colors.ivory,
    paddingBottom: 48,
    gap: 18,
  },
  trackList: { gap: 8, marginTop: 16 },
});
