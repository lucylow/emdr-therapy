import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { carrySessionParams, type SessionFlowParams } from "@/lib/session-flow";
const orientPrompts = [
  "Notice one color or object in the room, if you like.",
  "Notice a sound nearby, or choose a quiet moment.",
  "Look around at your own pace. You do not need to close your eyes.",
  "If comfortable, notice where your body is supported. You can skip body focus.",
  "If it feels helpful, notice one easy breath. You can also simply look around.",
];
const movementPrompts = [
  "If comfortable, roll your shoulders gently once—or choose stillness.",
  "You could move your hands or fingers in a comfortable way, or skip movement.",
  "You may shift your position if you want. No movement is required.",
];
export default function GroundingScreen() {
  const params = useLocalSearchParams<SessionFlowParams>();
  const sessionParams = carrySessionParams(params);
  const [mode, setMode] = useState<"orient" | "movement">("orient");
  const [index, setIndex] = useState(0);
  const prompts = mode === "orient" ? orientPrompts : movementPrompts;
  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      containerClassName="bg-[#F4F7F5]"
      className="px-5"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.orb}>
          <View style={styles.orbInner} />
        </View>
        <Text style={styles.eyebrow}>GROUNDING</Text>
        <Text style={styles.heading}>Come back to this moment.</Text>
        <Text style={styles.body}>Stimulation is stopped. Choose an outward cue, optional gentle movement, or no activity. You can stop or leave whenever you want.</Text>
        {params.scenarioName ? (
          <Text style={styles.caseNote}>
            Training case · {params.scenarioName}
          </Text>
        ) : null}
        <View style={styles.modeRow} accessibilityRole="radiogroup" accessibilityLabel="Choose an optional grounding activity">
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: mode === "orient" }} onPress={() => { setMode("orient"); setIndex(0); }} style={[styles.modeButton, mode === "orient" && styles.modeButtonActive]}><Text style={styles.modeText}>Look around</Text></Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ selected: mode === "movement" }} onPress={() => { setMode("movement"); setIndex(0); }} style={[styles.modeButton, mode === "movement" && styles.modeButtonActive]}><Text style={styles.modeText}>Move gently</Text></Pressable>
        </View>
        <View style={styles.prompt}>
          <Text style={styles.promptNumber}>{String(index + 1).padStart(2, "0")} · {mode === "orient" ? "OPTIONAL CUE" : "OPTIONAL MOVEMENT"}</Text>
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="summary"
            style={styles.promptText}
          >
            {prompts[index]}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip this cue and show another option"
          onPress={() => {
            setIndex((v) => (v + 1) % prompts.length);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Another option</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open optional gentle breathing exercise"
          onPress={() => router.push("/breathing")}
          style={styles.breathingButton}
        >
          <Text style={styles.breathingText}>Try a gentle breathing tool</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="End safely and continue to session closure"
          onPress={() =>
            router.push({
              pathname: "/session/closure",
              params: sessionParams as Record<string, string>,
            })
          }
        >
          <Text style={styles.end}>End safely</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 16,
    paddingVertical: 24,
  },
  orb: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#DCEBE5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  orbInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#B8D8D2",
  },
  eyebrow: {
    color: "#2F6F68",
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    textAlign: "center",
  },
  heading: {
    color: "#16252D",
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.6,
  },
  body: { color: "#60716F", fontSize: 15, lineHeight: 22, textAlign: "center" },
  prompt: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E2DE",
    padding: 20,
    minHeight: 118,
    justifyContent: "center",
    marginTop: 8,
  },
  promptNumber: {
    color: "#2F6F68",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  promptText: {
    color: "#16252D",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2F6F68",
    alignItems: "center",
    borderRadius: 15,
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  breathingButton: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  breathingText: { color: "#2F6F68", fontSize: 14, fontWeight: "700" },
  modeRow: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" },
  modeButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: "#D9E2DE", backgroundColor: "#FFFFFF" },
  modeButtonActive: { backgroundColor: "#DCEBE5", borderColor: "#2F6F68" },
  modeText: { color: "#2F6F68", fontSize: 13, fontWeight: "700" },
  caseNote: {
    color: "#2F6F68",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
  },
  end: {
    color: "#60716F",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    minHeight: 44,
    padding: 10,
  },
});
