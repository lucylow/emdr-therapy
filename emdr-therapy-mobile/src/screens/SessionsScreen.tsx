import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BottomNav } from "../components/navigation/BottomNav";
import { TopStatusBar } from "../components/navigation/TopStatusBar";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { Chip } from "../components/ui/Chip";
import { SessionCard } from "../components/sessions/SessionCard";
import { SESSIONS, type SessionCategory } from "../data/mock";
import { colors, spacing } from "../theme/tokens";

const categories: Array<"All" | SessionCategory> = [
  "All",
  "Short",
  "Focus",
  "Relax",
  "Reflection",
  "Audio",
  "Visual",
  "Combined",
];

export function SessionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | SessionCategory>("All");
  const filtered = useMemo(
    () =>
      filter === "All"
        ? SESSIONS
        : SESSIONS.filter((s) => s.categories.includes(filter)),
    [filter],
  );

  return (
    <View style={styles.root}>
      <TopStatusBar />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="SESSIONS"
          title="Choose what fits this moment."
          description="Explore short, calm experiences with adjustable audio and visual preferences."
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              label={category}
              selected={filter === category}
              onPress={() => setFilter(category)}
            />
          ))}
        </ScrollView>
        <View style={styles.list}>
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={() => router.push(`/session/${session.id}`)}
            />
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
  filters: { gap: 8, paddingRight: 20 },
  list: { gap: 12 },
});
