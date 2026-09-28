import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { AppText } from "../components/ui/AppText";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { MoodSelector } from "../components/reflection/MoodSelector";
import { AIReflectionCard } from "../components/reflection/AIReflectionCard";
import { JournalInput } from "../components/reflection/JournalInput";
import { useAppState } from "../state/AppStateProvider";
import { colors, spacing } from "../theme/tokens";

export function ReflectionScreen() {
  const router = useRouter();
  const { addReflection } = useAppState();
  const [before, setBefore] = useState<number | undefined>(5);
  const [after, setAfter] = useState<number | undefined>();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);

  const save = async () => {
    await addReflection({
      id: `reflection-${Date.now()}`,
      sessionId: "evening-reset",
      sessionTitle: "Evening Reset",
      createdAt: new Date().toISOString(),
      moodBefore: before ?? 5,
      moodAfter: after ?? 5,
      text: text.trim() || undefined,
    });
    router.replace("/home");
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <AppText variant="overline" style={{ color: colors.forest }}>
        REFLECTION
      </AppText>
      <AppText variant="display" style={{ marginTop: 5 }}>
        How do you feel right now?
      </AppText>
      <AppText muted style={{ marginTop: 7 }}>
        This is a self-reported check-in, not a clinical assessment.
      </AppText>

      <Card style={{ marginTop: 18 }}>
        <AppText variant="h3">Before</AppText>
        <View style={{ marginTop: 16 }}>
          <MoodSelector value={before} onChange={setBefore} />
        </View>
      </Card>

      <Card>
        <AppText variant="h3">After</AppText>
        <View style={{ marginTop: 16 }}>
          <MoodSelector value={after} onChange={setAfter} />
        </View>
      </Card>

      <AIReflectionCard text="You noted that the second half of your session felt easier to stay with." />

      <Card>
        <JournalInput value={text} onChange={setText} />
        <View style={styles.recording}>
          <Button
            label={recording ? "Stop recording" : "Optional voice note"}
            variant="secondary"
            onPress={() => setRecording((v) => !v)}
            style={{ flex: 1 }}
          />
          {recording ? (
            <AppText variant="caption" style={{ color: colors.danger }}>
              ● 00:18
            </AppText>
          ) : null}
        </View>
      </Card>

      <Button label="Save Reflection" onPress={save} />
      <Button
        label="Skip"
        variant="quiet"
        onPress={() =>
          Alert.alert(
            "Skip reflection?",
            "You can leave without adding a note.",
            [
              { text: "Stay", style: "cancel" },
              { text: "Skip", onPress: () => router.replace("/home") },
            ],
          )
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: colors.ivory,
    gap: 18,
  },
  recording: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
