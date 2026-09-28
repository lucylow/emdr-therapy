import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BackHeader } from "../components/ui/BackHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Card } from "../components/ui/Card";
import { SessionRow } from "../components/home/SessionRow";
import { SESSIONS } from "../data/mock";
import { colors } from "../theme/tokens";

export function HistoryScreen() {
  const router = useRouter();
  const completed = SESSIONS.filter((s) => Boolean(s.lastPlayed));
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <BackHeader title="History" />
      {completed.length === 0 ? (
        <EmptyState
          title="Your history starts here."
          description="Completed sessions will appear here."
          actionLabel="Browse Sessions"
          onAction={() => router.push("/sessions")}
        />
      ) : (
        <Card>
          {completed.map((session, index) => (
            <React.Fragment key={session.id}>
              <SessionRow
                title={session.title}
                subtitle={
                  session.lastPlayed
                    ? new Date(session.lastPlayed).toLocaleString()
                    : "Available"
                }
                duration={session.duration}
                onPress={() => router.push(`/session/${session.id}`)}
              />
              {index < completed.length - 1 ? (
                <View style={styles.divider} />
              ) : null}
            </React.Fragment>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, backgroundColor: colors.ivory },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.silk },
});
