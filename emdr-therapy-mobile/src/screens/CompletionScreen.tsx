import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppText } from "../components/ui/AppText";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ProgressRing } from "../components/session/ProgressRing";
import { colors, spacing } from "../theme/tokens";

export function CompletionScreen() {
  const router = useRouter();
  const { stopped } = useLocalSearchParams<{ stopped?: string }>();
  const completed = stopped !== "true";
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.check}>
          <AppText
            style={{ color: colors.white, fontSize: 28, fontWeight: "800" }}
          >
            ✓
          </AppText>
        </View>
        <AppText
          variant="display"
          style={{ textAlign: "center", marginTop: 20 }}
        >
          {completed ? "Session complete" : "Session saved"}
        </AppText>
        <AppText muted style={{ textAlign: "center", marginTop: 8 }}>
          {completed
            ? "Take a moment before moving on."
            : "Your progress is available in your session history."}
        </AppText>
      </View>
      <Card style={styles.summary}>
        <ProgressRing
          progress={completed ? 1 : 0.64}
          size={96}
          value={completed ? "12:00" : "07:42"}
          label="Session time"
        />
        <View style={{ flex: 1 }}>
          <AppText variant="h3">Evening Reset</AppText>
          <AppText variant="caption" muted style={{ marginTop: 4 }}>
            Audio + Visual
          </AppText>
          <AppText variant="caption" muted style={{ marginTop: 4 }}>
            Private reflection available
          </AppText>
        </View>
      </Card>
      <Button
        label="Reflect on this session"
        onPress={() => router.push("/session/reflection")}
      />
      <Button
        label="Back to Home"
        variant="secondary"
        onPress={() => router.replace("/home")}
      />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.ivory,
    justifyContent: "center",
    gap: 18,
  },
  hero: { alignItems: "center", paddingBottom: 10 },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  summary: { flexDirection: "row", alignItems: "center", gap: 20 },
});
