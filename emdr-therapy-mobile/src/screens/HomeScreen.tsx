import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BottomNav } from "../components/navigation/BottomNav";
import { TopStatusBar } from "../components/navigation/TopStatusBar";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { colors } from "../theme/tokens";

export function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <TopStatusBar />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="overline" style={{ color: colors.forest }}>YOUR COMPANION</AppText>
        <AppText variant="display" style={{ marginTop: 5 }}>What would feel useful right now?</AppText>
        <AppText muted style={{ marginTop: 8, lineHeight: 22 }}>
          Choose a tool, or do nothing for now. These options do not assess or diagnose you.
        </AppText>

        <Card style={styles.choiceCard}>
          <AppText variant="h3">Ground in the present</AppText>
          <AppText variant="caption" muted style={styles.detail}>Optional sensory cues, with an outward-focus alternative.</AppText>
          <Button label="Open grounding" onPress={() => router.push("/session/grounding")} style={styles.button} />
        </Card>
        <Card style={styles.choiceCard}>
          <AppText variant="h3">Check in with yourself</AppText>
          <AppText variant="caption" muted style={styles.detail}>A brief, optional check-in. Nothing is saved from this screen.</AppText>
          <Button label="Start a check-in" variant="secondary" onPress={() => router.push("/check-in")} style={styles.button} />
        </Card>
        <Card style={styles.choiceCard}>
          <AppText variant="h3">Write privately</AppText>
          <AppText variant="caption" muted style={styles.detail}>Write only what feels useful. Sharing is always your choice.</AppText>
          <Button label="Open journal" variant="secondary" onPress={() => router.push("/(tabs)/journal")} style={styles.button} />
        </Card>
        <Card style={styles.choiceCard}>
          <AppText variant="h3">Prepare for a practice</AppText>
          <AppText variant="caption" muted style={styles.detail}>Review sensory options and choose your pause plan before continuing.</AppText>
          <Button label="Review practice setup" variant="secondary" onPress={() => router.push("/session/setup")} style={styles.button} />
        </Card>
        <Card style={styles.choiceCard}>
          <AppText variant="h3">Connect with someone</AppText>
          <AppText variant="caption" muted style={styles.detail}>Use the support options you have chosen for yourself.</AppText>
          <Button label="View support options" variant="secondary" onPress={() => router.push("/therapist-connect")} style={styles.button} />
        </Card>
        <Card style={styles.notice}>
          <AppText variant="bodyStrong">A companion, not a replacement for care</AppText>
          <AppText variant="caption" muted style={{ marginTop: 6, lineHeight: 19 }}>
            This app does not provide EMDR therapy or guide trauma-memory processing. Every activity is optional and can be stopped.
          </AppText>
        </Card>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 20, paddingBottom: 140, gap: 14 },
  choiceCard: { padding: 18 },
  detail: { marginTop: 5, lineHeight: 19 },
  button: { marginTop: 12 },
  notice: { backgroundColor: "#FFF7E9", padding: 18 },
});
