import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { LocalDataStatus } from "@/components/local-data-status";
import {
  BilateralMark,
  DS,
  PrimaryButton,
} from "@/components/ui/design-system";
import { SessionWizardProgress } from "@/components/session-wizard-progress";
import { appendTelemetryEvent, saveSession } from "@/lib/session-store";
import { SIMULATED_SCENARIOS } from "@/lib/scenarios";
import { haptic } from "@/lib/haptics";

export default function ClosureScreen() {
  const params = useLocalSearchParams<{
    duration?: string;
    mode?: string;
    sud?: string;
    sessionId?: string;
    scenarioId?: string;
    scenarioName?: string;
  }>();
  const [finalSud, setFinalSud] = useState<number | null>(null);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const scenario = SIMULATED_SCENARIOS.find(
    (item) => item.id === params.scenarioId,
  );

  const finish = async () => {
    if (saving || saved) return;
    setSaving(true);
    setSaveError(false);
    try {
      const now = new Date().toISOString();
      if (params.sessionId) {
        const stopped = await appendTelemetryEvent(params.sessionId, {
          id: `${params.sessionId}_stop_${Date.now()}`,
          createdAt: now,
          type: "set-stopped",
          phase: "Closure",
          note: "Completed safely from closure",
        });
        if (!stopped)
          throw new Error("closure stop event was not acknowledged");
        if (finalSud !== null) {
          const sudRecorded = await appendTelemetryEvent(params.sessionId, {
            id: `${params.sessionId}_sud_${Date.now()}`,
            createdAt: now,
            type: "sud-recorded",
            phase: "Closure",
            value: finalSud,
          });
          if (!sudRecorded)
            throw new Error("closure check-in was not acknowledged");
        }
      }
      const savedLocally = await saveSession({
        id: params.sessionId
          ? `summary_${params.sessionId}`
          : `session_${Date.now()}`,
        createdAt: now,
        durationMinutes: Number(params.duration || 10),
        mode: (params.mode || "visual") as
          | "visual"
          | "audio"
          | "haptic"
          | "mixed",
        ...(params.sud !== undefined
          ? { initialSud: Number(params.sud) }
          : {}),
        ...(finalSud !== null ? { finalSud } : {}),
        reflection: reflection.trim() || undefined,
      });
      if (!savedLocally)
        throw new Error("local session save was not acknowledged");
      setSaved(true);
      haptic.success();
    } catch (error) {
      console.warn("[closure] could not save session locally", error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      edges={["top", "bottom", "left", "right"]}
      containerClassName="bg-[#F4F7F5]"
      className="px-5 pt-4"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <SessionWizardProgress active={3} />
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PHASE 8 · CLOSURE</Text>
            <Text style={styles.heading}>
              Leave the session{`\n`}at your own pace.
            </Text>
          </View>
          <BilateralMark size={46} />
        </View>
        <Text style={styles.body}>
          Take a moment to notice the room, your breathing, and the support
          beneath you. You do not need to make meaning of anything right now.
        </Text>
        {scenario ? (
          <View style={styles.cue}>
            <Text style={styles.cueLabel}>SUPERVISOR TEACHING CUE</Text>
            <Text style={styles.cueText}>{scenario.teachingNote}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>
          Optional self-rating: {finalSud === null ? "not answered" : `${finalSud}/10`}
        </Text>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Optional post-session self-rating from zero to ten"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={styles.scale}>
              {Array.from({ length: 11 }, (_, i) => (
                <Pressable
                  key={i}
                  accessibilityRole="radio"
                  accessibilityLabel={`After-session rating ${i} of 10`}
                  accessibilityState={{ selected: finalSud === i }}
                  onPress={() => {
                    haptic.light();
                    setFinalSud(i);
                  }}
                  style={[styles.scaleDot, finalSud === i && styles.selected]}
                >
                  <Text
                    style={[
                      styles.scaleText,
                      finalSud === i && styles.selectedText,
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
            accessibilityLabel="Skip the optional after-session rating"
            accessibilityState={{ selected: finalSud === null }}
            onPress={() => setFinalSud(null)}
            style={[styles.skipRating, finalSud === null && styles.skipRatingActive]}
          >
            <Text style={styles.skipText}>Prefer not to rate</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Optional reflection</Text>
        <TextInput
          multiline
          value={reflection}
          onChangeText={(value) => {
            setReflection(value);
            setSaveError(false);
          }}
          placeholder="Optional — no trauma details are needed"
          placeholderTextColor="#9AA9A5"
          style={styles.input}
          textAlignVertical="top"
          accessibilityLabel="Optional closure reflection; no trauma details are needed"
        />
        {saveError ? (
          <LocalDataStatus
            title="This session could not be saved locally"
            message="Your reflection is still here and no data was sent anywhere. Try saving again when ready."
            onRetry={finish}
            busy={saving}
          />
        ) : null}
        {saved ? (
          <View style={styles.success}>
            <Text style={styles.successTitle}>Session saved privately</Text>
            <Text style={styles.successBody}>
              Your reflection is available in Progress. You can close this
              screen now.
            </Text>
          </View>
        ) : (
          <PrimaryButton onPress={finish} disabled={saving} icon="checkmark">
            {saving ? "Saving privately…" : "Save and finish"}
          </PrimaryButton>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return home"
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.home}>Return home</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 4,
  },
  eyebrow: {
    color: DS.deep,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  heading: {
    color: DS.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    marginTop: 6,
  },
  body: { color: DS.muted, fontSize: 14, lineHeight: 21, marginTop: 4 },
  label: { color: DS.ink, fontSize: 14, fontWeight: "700", marginTop: 5 },
  scale: {
    flexDirection: "row",
    gap: 4,
    padding: 6,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.line,
    borderRadius: 16,
  },
  scaleDot: {
    width: 44,
    minHeight: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  selected: { backgroundColor: DS.deep },
  scaleText: { color: DS.muted, fontSize: 12 },
  selectedText: { color: "#FFFFFF", fontWeight: "700" },
  skipRating: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: DS.line,
    backgroundColor: DS.surface,
  },
  skipRatingActive: { borderColor: DS.deep, backgroundColor: DS.mint },
  skipText: { color: DS.ink, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 130,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.line,
    borderRadius: 16,
    padding: 14,
    color: DS.ink,
    fontSize: 14,
    lineHeight: 20,
  },
  cue: { backgroundColor: DS.lavender, borderRadius: 16, padding: 14 },
  cueLabel: {
    color: DS.deep,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
    marginBottom: 5,
  },
  cueText: { color: DS.muted, fontSize: 12, lineHeight: 18 },
  success: { backgroundColor: DS.mint, borderRadius: 16, padding: 15 },
  successTitle: {
    color: DS.ink,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  successBody: { color: DS.muted, fontSize: 12, lineHeight: 17 },
  home: {
    color: DS.muted,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    padding: 8,
  },
});
