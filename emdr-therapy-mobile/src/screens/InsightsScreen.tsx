import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BottomNav } from "../components/navigation/BottomNav";
import { TopStatusBar } from "../components/navigation/TopStatusBar";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { AppText } from "../components/ui/AppText";
import { Card } from "../components/ui/Card";
import { QuickMetric } from "../components/home/QuickMetric";
import { WeeklyChart } from "../components/insights/WeeklyChart";
import { CheckinChart } from "../components/insights/CheckinChart";
import { InsightCard } from "../components/insights/InsightCard";
import { colors } from "../theme/tokens";

export function InsightsScreen() {
  return (
    <View style={styles.root}>
      <TopStatusBar />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="INSIGHTS"
          title="Your patterns"
          description="A gentle look back at your recent activity."
        />
        <View style={styles.metrics}>
          <QuickMetric value="5" label="Sessions" />
          <QuickMetric value="57" label="Minutes" tone="lavender" />
          <QuickMetric value="4" label="Reflections" tone="warm" />
        </View>
        <Card>
          <AppText variant="h3">This week</AppText>
          <AppText variant="caption" muted style={{ marginTop: 4 }}>
            Session time by day
          </AppText>
          <View style={{ marginTop: 18 }}>
            <WeeklyChart />
          </View>
        </Card>
        <Card>
          <AppText variant="h3">Self-reported check-ins</AppText>
          <AppText variant="caption" muted style={{ marginTop: 4 }}>
            Your own selections shown descriptively.
          </AppText>
          <View style={{ marginTop: 18 }}>
            <CheckinChart />
          </View>
        </Card>
        <InsightCard
          title="AI-assisted pattern"
          description="Your recent sessions have mostly been short evening experiences. This is a descriptive observation from activity data, not a clinical conclusion."
        />
      </ScrollView>
      <BottomNav />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 20, paddingBottom: 140, gap: 18 },
  metrics: { flexDirection: "row", gap: 8 },
});
