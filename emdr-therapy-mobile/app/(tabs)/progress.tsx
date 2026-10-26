import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import {
  BilateralMark,
  Card,
  DS,
  Metric,
  SectionLabel,
  SegmentedControl,
} from "@/components/ui/design-system";
import {
  getProgressActivity,
  type BreathingPractice,
  type SessionSummary,
} from "@/lib/session-store";

export default function ProgressScreen() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [breathing, setBreathing] = useState<BreathingPractice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("overview");
  const [usingFallback, setUsingFallback] = useState(false);
  const load = useCallback(async () => {
    try {
      const activity = await getProgressActivity();
      setSessions(activity.sessions);
      setBreathing(activity.breathing);
      setUsingFallback(activity.usedFallback);
    } catch (error) {
      console.warn(
        "[progress] local activity load failed",
        error instanceof Error ? error.name : "unknown",
      );
      setSessions([]);
      setBreathing([]);
      setUsingFallback(true);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const ratedSessions = sessions.filter(
    (session) =>
      session.initialSud !== undefined && session.finalSud !== undefined,
  );
  const reduction = ratedSessions.length
    ? ratedSessions.reduce(
        (sum, session) =>
          sum + (session.initialSud! - session.finalSud!),
        0,
      ) / ratedSessions.length
    : null;
  return (
    <ScreenContainer containerClassName="bg-[#F4F7F5]" className="px-5 pt-4">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={DS.deep}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>INSIGHTS</Text>
            <Text style={styles.heading}>Your progress</Text>
          </View>
          <BilateralMark size={44} />
        </View>
        {usingFallback ? (
          <View style={styles.previewBanner}>
            <Text style={styles.previewTitle}>LOCAL DATA UNAVAILABLE</Text>
            <Text style={styles.previewBody}>
              Saved activity could not be read. No sample values are shown; try
              again when local storage is available.
            </Text>
          </View>
        ) : null}
        <SegmentedControl
          options={[
            { value: "overview", label: "Overview" },
            { value: "sessions", label: "Sessions" },
            { value: "insights", label: "Insights" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "overview" ? (
          <>
            <Card>
              <SectionLabel right="SELF-REPORT">Paired check-ins</SectionLabel>
              <Text
                accessibilityRole="text"
                style={styles.accessibilitySummary}
              >
                {reduction === null
                  ? "No paired pre/post self-ratings are saved. Check-ins are optional."
                  : `Average self-reported difference is ${reduction.toFixed(1)} points across ${ratedSessions.length} paired check-in${ratedSessions.length === 1 ? "" : "s"}. This is not a clinical outcome measure.`}
              </Text>
              <View style={styles.reductionRow}>
                <View>
                  <Text style={styles.big}>
                    {reduction === null ? "—" : `${reduction.toFixed(1)}`}
                  </Text>
                  <Text style={styles.muted}>average self-reported difference</Text>
                  <Text style={styles.delta}>
                    {reduction === null
                      ? "No rating is required"
                      : "Personal reflection only; not a score to chase"}
                  </Text>
                </View>
              </View>
            </Card>
            <Card>
              <SectionLabel right="ON THIS DEVICE">Saved activity</SectionLabel>
              <View style={styles.frequency}>
                <Metric
                  value={String(sessions.length)}
                  label="practice sessions"
                />
                <Metric value={String(breathing.length)} label="breathing practices" />
              </View>
            </Card>
          </>
        ) : tab === "sessions" ? (
          <Card>
            <Text style={styles.cardTitle}>Recent activity</Text>
            {sessions.length === 0 && breathing.length === 0 ? (
              <Text style={styles.mutedBody}>
                Completed sessions and breathing practices will appear here.
              </Text>
            ) : (
              <View style={styles.activityList}>
                {[
                  ...sessions.map((session) => ({
                    id: session.id,
                    title: "Practice session",
                    body: `${session.durationMinutes} min · Before ${session.initialSud === undefined ? "—" : `${session.initialSud}/10`} · After ${session.finalSud === undefined ? "—" : `${session.finalSud}/10`}`,
                    createdAt: session.createdAt,
                  })),
                  ...breathing.map((practice) => ({
                    id: practice.id,
                    title: "Breathing practice",
                    body: `${practice.rounds} rounds · ${practice.durationSeconds}s`,
                    createdAt: practice.createdAt,
                  })),
                ]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 8)
                  .map((item) => (
                    <View key={item.id} style={styles.activity}>
                      <View style={styles.activityDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle}>{item.title}</Text>
                        <Text style={styles.activityBody}>{item.body}</Text>
                      </View>
                      <Text style={styles.activityDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </Card>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>Gentle insights</Text>
            <Text style={styles.mutedBody}>
              As you use the app, this space can help you notice patterns
              without labelling or diagnosing your experience.
            </Text>
          </Card>
        )}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
          Saved data stays on this device. Self-ratings are optional personal reports, not a clinical assessment or treatment outcome.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  content: { paddingBottom: 40, gap: 13 },
  previewBanner: { backgroundColor: "#FFF7E9", borderRadius: 16, padding: 14 },
  previewTitle: {
    color: DS.deep,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "800",
    marginBottom: 4,
  },
  previewBody: { color: DS.muted, fontSize: 12, lineHeight: 18 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  eyebrow: {
    color: DS.deep,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: 4,
  },
  heading: {
    color: DS.ink,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  reductionRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  big: { color: DS.ink, fontSize: 34, fontWeight: "700" },
  muted: { color: DS.muted, fontSize: 11, marginTop: 2 },
  delta: {
    color: DS.deep,
    fontSize: 11,
    lineHeight: 15,
    maxWidth: 142,
    marginTop: 10,
  },
  accessibilitySummary: {
    color: DS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },
  frequency: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 9,
  },
  cardTitle: {
    color: DS.ink,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  mutedBody: { color: DS.muted, fontSize: 14, lineHeight: 21 },
  activityList: { gap: 12, marginTop: 4 },
  activity: { flexDirection: "row", alignItems: "center", gap: 10 },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS.deep,
  },
  activityTitle: { color: DS.ink, fontSize: 13, fontWeight: "700" },
  activityBody: { color: DS.muted, fontSize: 11, marginTop: 2 },
  activityDate: { color: DS.muted, fontSize: 10 },
  disclaimer: { backgroundColor: DS.lavender, borderRadius: 14, padding: 13 },
  disclaimerText: {
    color: DS.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
