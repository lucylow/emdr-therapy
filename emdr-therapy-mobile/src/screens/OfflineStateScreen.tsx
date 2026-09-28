import React from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { BackHeader } from "../components/ui/BackHeader";
import { Card } from "../components/ui/Card";
import { AppText } from "../components/ui/AppText";
import { InlineStatus } from "../components/ui/InlineStatus";
import { Button } from "../components/ui/Button";
import { colors, spacing } from "../theme/tokens";

export function OfflineStateScreen() {
  const router = useRouter();
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        backgroundColor: colors.ivory,
        gap: 16,
      }}
    >
      <BackHeader title="Offline" />
      <InlineStatus label="Offline mode" tone="warning" />
      <Card>
        <AppText variant="h2">Your local experience can continue.</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          Representative session and reflection data can remain available while
          network-backed features wait to retry.
        </AppText>
      </Card>
      <Card>
        <AppText variant="bodyStrong">Available offline</AppText>
        <AppText variant="caption" muted style={{ marginTop: 4 }}>
          3 sessions • 4 reflections • 2 items waiting to sync
        </AppText>
      </Card>
      <Button label="Back Home" onPress={() => router.replace("/home")} />
    </ScrollView>
  );
}
