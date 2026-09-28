import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackHeader } from "../components/ui/BackHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SessionMeta } from "../components/session/SessionMeta";
import { VisualSettingsPanel } from "../components/session/VisualSettingsPanel";
import { colors, spacing } from "../theme/tokens";
import { SESSIONS } from "../data/mock";

export function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useMemo(
    () => SESSIONS.find((s) => s.id === id) ?? SESSIONS[0],
    [id],
  );
  const [audio, setAudio] = useState(true);
  const [visual, setVisual] = useState(true);
  const [mode, setMode] = useState<
    "soft-orb" | "horizontal-line" | "minimal-dot"
  >("soft-orb");

  const begin = () => {
    if (!audio && !visual) {
      Alert.alert(
        "Choose one experience",
        "Turn on audio or visual guidance before starting.",
      );
      return;
    }
    router.push(`/session/active?sessionId=${session.id}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <BackHeader title={session.title} />
      <View style={styles.hero}>
        <AppText variant="overline" style={{ color: colors.forest }}>
          SESSION
        </AppText>
        <AppText variant="display" style={{ marginTop: 5 }}>
          {session.title}
        </AppText>
        <AppText muted style={{ marginTop: 6 }}>
          {session.description}
        </AppText>
      </View>

      <SessionMeta
        duration={session.duration}
        format={session.format}
        intensity={session.intensity}
      />

      <Card style={{ backgroundColor: colors.graphite }}>
        <AppText variant="h2" style={{ color: colors.white }}>
          A simple setup.
        </AppText>
        <AppText style={{ color: "#D2D2D6", marginTop: 8 }}>
          Adjust your experience before you begin. You can pause or exit at any
          time.
        </AppText>
      </Card>

      <Card>
        <SettingToggle
          title="Audio"
          detail={audio ? "Soft Focus" : "Off"}
          value={audio}
          onPress={() => setAudio((v) => !v)}
        />
        <SettingToggle
          title="Visual cue"
          detail={visual ? "Enabled" : "Off"}
          value={visual}
          onPress={() => setVisual((v) => !v)}
        />
        {visual ? (
          <VisualSettingsPanel enabled={visual} mode={mode} onMode={setMode} />
        ) : null}
      </Card>

      <Button label="Begin Session" onPress={begin} />
    </ScrollView>
  );
}

function SettingToggle({
  title,
  detail,
  value,
  onPress,
}: {
  title: string;
  detail: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" muted>
          {detail}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onPress={onPress}
      >
        <AppText
          style={{
            color: value ? colors.forest : colors.mist,
            fontWeight: "700",
          }}
        >
          {value ? "On" : "Off"}
        </AppText>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: colors.ivory,
    gap: 20,
  },
  hero: { paddingTop: 8 },
  toggle: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
});
