import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "../components/ui/AppText";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { Icon } from "../components/ui/Icon";
import { useAppState } from "../state/AppStateProvider";
import { colors, spacing } from "../theme/tokens";

const pages = [
  {
    title: "A calmer place to focus inward.",
    body: "Guided sessions, audio-visual tools, and gentle reflection in one private mobile experience.",
  },
  {
    title: "Designed around your comfort.",
    body: "Choose the sound, visual mode, timing, and motion settings you prefer.",
  },
  {
    title: "Your reflections are personal.",
    body: "The interface treats journal notes and check-ins as sensitive user content.",
  },
  {
    title: "Make the experience yours.",
    body: "Start with sensible defaults and change them later in settings.",
  },
  {
    title: "Before you begin.",
    body: "EMDR Flow AI is a digital wellness tool and does not replace professional mental-health care.",
  },
  {
    title: "Ready for your next session?",
    body: "Choose a short experience, start when you are ready, and keep control of the session.",
  },
];

export function OnboardingScreen() {
  const router = useRouter();
  const { setOnboardingComplete } = useAppState();
  const [index, setIndex] = useState(0);
  const [audio, setAudio] = useState(true);
  const [visual, setVisual] = useState(true);
  const [haptics, setHaptics] = useState(false);
  const current = pages[index];
  const last = index === pages.length - 1;

  const finish = async () => {
    await setOnboardingComplete(true);
    router.replace("/home");
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brand}>
        <View style={styles.logo}>
          <AppText
            style={{ color: colors.white, fontSize: 25, fontWeight: "800" }}
          >
            E
          </AppText>
        </View>
        <AppText variant="overline" style={{ color: colors.forest }}>
          EMDR FLOW AI
        </AppText>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progress,
            { width: `${((index + 1) / pages.length) * 100}%` },
          ]}
        />
      </View>

      <View style={styles.illustration}>
        <View style={styles.illustrationOrb} />
        <View style={styles.illustrationLine} />
      </View>

      <AppText variant="display">{current.title}</AppText>
      <AppText muted style={{ marginTop: spacing.md }}>
        {current.body}
      </AppText>

      {index === 2 ? (
        <Card style={styles.privacyCard}>
          <Icon name="lock-closed-outline" color={colors.forest} size={25} />
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">Privacy-conscious by default</AppText>
            <AppText variant="caption" muted style={{ marginTop: 3 }}>
              Private reflections should not appear in routine logs or support
              messages.
            </AppText>
          </View>
        </Card>
      ) : null}

      {index === 3 ? (
        <Card style={{ marginTop: spacing.xl }}>
          <AppText variant="bodyStrong">Session defaults</AppText>
          <View style={styles.chips}>
            <Chip
              label="Audio On"
              selected={audio}
              onPress={() => setAudio((v) => !v)}
            />
            <Chip
              label="Visual On"
              selected={visual}
              onPress={() => setVisual((v) => !v)}
            />
            <Chip
              label="Haptics Off"
              selected={!haptics}
              onPress={() => setHaptics((v) => !v)}
            />
          </View>
        </Card>
      ) : null}

      {index === 4 ? (
        <Card
          style={{ marginTop: spacing.xl, backgroundColor: colors.warmPale }}
        >
          <AppText variant="caption">
            Use this product as a digital wellness experience. Seek professional
            support when appropriate.
          </AppText>
        </Card>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={last ? "Enter EMDR Flow AI" : "Continue"}
          onPress={last ? finish : () => setIndex((v) => v + 1)}
        />
        {index > 0 ? (
          <Button
            label="Back"
            variant="quiet"
            onPress={() => setIndex((v) => v - 1)}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    backgroundColor: colors.ivory,
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  brand: { alignItems: "center", gap: 12 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    marginTop: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.silk,
    overflow: "hidden",
  },
  progress: { height: 4, backgroundColor: colors.forest },
  illustration: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 22,
  },
  illustrationOrb: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.forestLight,
    opacity: 0.72,
  },
  illustrationLine: {
    position: "absolute",
    width: "70%",
    height: 1,
    backgroundColor: colors.forestLight,
    opacity: 0.6,
  },
  privacyCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  footer: { marginTop: "auto", paddingTop: 42, gap: 8 },
});
