import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { SettingsSection } from "../components/settings/SettingsSection";
import { SettingRow } from "../components/settings/SettingRow";
import { Card } from "../components/ui/Card";
import { AppText } from "../components/ui/AppText";
import { Button } from "../components/ui/Button";
import { colors } from "../theme/tokens";

export function NotificationSettingsScreen() {
  const router = useRouter();
  const [session, setSession] = useState(true);
  const [reflection, setReflection] = useState(false);
  const [summary, setSummary] = useState(true);

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        backgroundColor: colors.ivory,
      }}
    >
      <ScreenHeader
        eyebrow="NOTIFICATIONS"
        title="Gentle reminders."
        description="Choose which reminders are useful to you."
      />
      <Card>
        <AppText variant="h3">Reminder time</AppText>
        <AppText muted style={{ marginTop: 4 }}>
          8:00 PM
        </AppText>
        <Button
          label="Change time"
          variant="secondary"
          onPress={() => {}}
          style={{ marginTop: 16 }}
        />
      </Card>
      <SettingsSection title="REMINDERS">
        <SettingRow
          icon="play-circle-outline"
          title="Session reminder"
          subtitle="Every evening"
          value={session}
          onValueChange={setSession}
        />
        <SettingRow
          icon="create-outline"
          title="Reflection reminder"
          subtitle="After completed sessions"
          value={reflection}
          onValueChange={setReflection}
        />
        <SettingRow
          icon="calendar-outline"
          title="Weekly summary"
          subtitle="Sunday evening"
          value={summary}
          onValueChange={setSummary}
        />
      </SettingsSection>
      <View style={{ marginTop: 8 }}>
        <Button label="Done" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
