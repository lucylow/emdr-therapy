import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { SessionWizardProgress } from "@/components/session-wizard-progress";
import { haptic } from "@/lib/haptics";
import { carrySessionParams, type SessionFlowParams } from "@/lib/session-flow";
export default function AssessmentScreen() {
  const params = useLocalSearchParams<SessionFlowParams>();
  const [sud, setSud] = React.useState<number | null>(null);
  const sessionParams = carrySessionParams({
    ...params,
    ...(sud === null ? {} : { sud: String(sud) }),
  });
  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView contentContainerStyle={styles.content}>
        <SessionWizardProgress active={1} />
        <Text style={styles.eyebrow}>PHASE 3 · ASSESSMENT</Text>
        <Text style={styles.heading}>Check in only if you choose.</Text>
        <Text style={styles.body}>
          No narrative or trauma details are needed. This optional 0–10 rating
          is a personal check-in, not a clinical measure.
        </Text>
        <Text style={styles.label}>
          Optional self-rating: {sud === null ? "not answered" : `${sud}/10`}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Optional pre-session self-rating from zero to ten"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.scale}>
              {Array.from({ length: 11 }, (_, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="radio"
                  accessibilityLabel={`Before-session rating ${i} of 10`}
                  accessibilityState={{ selected: i === sud }}
                  onPress={() => {
                    haptic.light();
                    setSud(i);
                  }}
                  style={[styles.scaleDot, i === sud && styles.scaleSelected]}
                >
                  <Text
                    style={[
                      styles.scaleText,
                      i === sud && styles.scaleTextSelected,
                    ]}
                  >
                    {i}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Skip the optional before-session rating"
            accessibilityState={{ selected: sud === null }}
            onPress={() => setSud(null)}
            style={[styles.skipRating, sud === null && styles.skipRatingActive]}
          >
            <Text style={styles.skipText}>Prefer not to rate</Text>
          </Pressable>
        </View>
        <View style={styles.note}>
          <Text style={styles.noteText}>
            This app does not diagnose or replace licensed EMDR care. Do not use
            it for unsupervised trauma processing. Stop and ground if you feel
            uncomfortable or unsafe.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start the session's gentle practice"
          onPress={() => {
            haptic.light();
            router.push({
              pathname: "/session/bls",
              params: sessionParams as Record<string, string>,
            });
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Start one gentle set</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 44 },
  eyebrow: {
    color: "#2F6F68",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginTop: 4,
  },
  heading: {
    color: "#16252D",
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "700",
  },
  body: { color: "#60716F", fontSize: 14, lineHeight: 21, marginBottom: 8 },
  label: { color: "#16252D", fontSize: 14, fontWeight: "700", marginTop: 4 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#16252D",
    fontSize: 14,
  },
  scale: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E2DE",
    borderRadius: 16,
    padding: 6,
  },
  scaleDot: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  scaleSelected: { backgroundColor: "#2F6F68" },
  scaleText: { color: "#60716F", fontSize: 12 },
  scaleTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  skipRating: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D9E2DE",
    backgroundColor: "#FFFFFF",
  },
  skipRatingActive: { borderColor: "#2F6F68", backgroundColor: "#DCEBE5" },
  skipText: { color: "#16252D", fontSize: 13, fontWeight: "700" },
  note: {
    backgroundColor: "#FFF7E9",
    borderRadius: 14,
    padding: 13,
    marginTop: 4,
  },
  noteText: { color: "#776345", fontSize: 12, lineHeight: 17 },
  button: {
    backgroundColor: "#2F6F68",
    alignItems: "center",
    borderRadius: 15,
    paddingVertical: 16,
    marginTop: 8,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
