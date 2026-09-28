import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BottomNav } from "../components/navigation/BottomNav";
import { TopStatusBar } from "../components/navigation/TopStatusBar";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { SectionHeader } from "../components/ui/SectionHeader";
import { ContinueCard } from "../components/home/ContinueCard";
import { QuickMetric } from "../components/home/QuickMetric";
import { SessionRow } from "../components/home/SessionRow";
import { SESSIONS, USER_PROFILE } from "../data/mock";
import { colors, spacing } from "../theme/tokens";

export function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <TopStatusBar />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="display">
          Good evening, {USER_PROFILE.name.split(" ")[0]}
        </AppText>
        <AppText muted style={{ marginTop: 6 }}>
          Take a moment for yourself.
        </AppText>

        <ContinueCard
          title="Evening Reset"
          duration={12}
          progress={0.64}
          onContinue={() =>
            router.push("/session/active?sessionId=evening-reset")
          }
        />

        <View style={styles.metrics}>
          <QuickMetric value="5" label="Sessions this week" />
          <QuickMetric value="57" label="Minutes" tone="lavender" />
          <QuickMetric value="4" label="Reflections" tone="warm" />
        </View>

        <SectionHeader title="Your week" />
        <Card style={styles.checkinCard}>
          <View style={styles.checkinHead}>
            <View>
              <AppText variant="bodyStrong">Self-reported check-in</AppText>
              <AppText variant="caption" muted style={{ marginTop: 3 }}>
                Before 5/10 → After 7/10
              </AppText>
            </View>
            <AppText variant="caption" style={{ color: colors.grow }}>
              +2
            </AppText>
          </View>
          <View style={styles.checkinTrack}>
            <View style={[styles.checkinFill, { width: "70%" }]} />
          </View>
          <AppText variant="caption" muted style={{ marginTop: 8 }}>
            Illustrative activity data
          </AppText>
        </Card>

        <SectionHeader
          title="Recent sessions"
          action="See all"
          onAction={() => router.push("/sessions")}
        />
        <Card>
          {SESSIONS.slice(0, 4).map((session, index) => (
            <React.Fragment key={session.id}>
              <SessionRow
                title={session.title}
                subtitle={
                  session.lastPlayed ? "Completed recently" : "Available"
                }
                duration={session.duration}
                onPress={() => router.push(`/session/${session.id}`)}
              />
              {index < 3 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))}
        </Card>

        <SectionHeader title="Suggested for you" />
        <View style={styles.suggested}>
          {SESSIONS.slice(4, 6).map((session) => (
            <Card
              key={session.id}
              onPress={() => router.push(`/session/${session.id}`)}
              style={{ flex: 1 }}
            >
              <AppText variant="h3">{session.title}</AppText>
              <AppText variant="caption" muted style={{ marginTop: 4 }}>
                {session.duration} min • {session.format}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: colors.forest, marginTop: 14 }}
              >
                Open →
              </AppText>
            </Card>
          ))}
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 20, paddingBottom: 140, gap: 20 },
  metrics: { flexDirection: "row", gap: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.silk },
  suggested: { flexDirection: "row", gap: 12 },
  checkinCard: { padding: 18 },
  checkinHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkinTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cloud,
    overflow: "hidden",
    marginTop: 16,
  },
  checkinFill: {
    height: "100%",
    backgroundColor: colors.forest,
    borderRadius: 5,
  },
});
