import React from "react";
import { Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Card } from "../../components/ui/Card";
import { AppText } from "../../components/ui/AppText";
import { SettingRow } from "../../components/settings/SettingRow";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { Button } from "../../components/ui/Button";
import { colors, spacing } from "../../theme/tokens";

export function PrivacySettingsScreen() {
  const router = useRouter();
  const confirmDelete = () =>
    Alert.alert(
      "Delete reflections?",
      "This prototype simulates removing saved reflections from the device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "Deleted",
              "Reflection data has been cleared in this demo.",
            ),
        },
      ],
    );
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        backgroundColor: colors.ivory,
        gap: 18,
      }}
    >
      <ScreenHeader
        eyebrow="PRIVACY"
        title="Your personal space."
        description="Manage data controls without exposing sensitive content in normal support or error flows."
      />
      <Card>
        <AppText variant="h3">Private reflection</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          Journal entries and check-ins are treated as sensitive user content.
        </AppText>
      </Card>
      <SettingsSection title="DATA CONTROLS">
        <SettingRow
          icon="download-outline"
          title="Export your data"
          subtitle="Create a portable copy"
          onPress={() =>
            Alert.alert(
              "Export",
              "Export flow ready for native implementation.",
            )
          }
        />
        <SettingRow
          icon="trash-outline"
          title="Delete reflections"
          subtitle="Remove saved reflections"
          onPress={confirmDelete}
        />
        <SettingRow
          icon="refresh-outline"
          title="Clear session history"
          subtitle="Reset activity history"
          onPress={() =>
            Alert.alert(
              "Cleared",
              "History reset is simulated in the prototype.",
            )
          }
        />
      </SettingsSection>
      <SettingsSection title="PERMISSIONS">
        <SettingRow
          icon="mic-outline"
          title="Microphone"
          subtitle="Optional voice-note feature"
          onPress={() =>
            Alert.alert(
              "Microphone",
              "Native permission flow can be connected to expo-audio.",
            )
          }
        />
        <SettingRow
          icon="notifications-outline"
          title="Notifications"
          subtitle="Session reminders"
          onPress={() =>
            Alert.alert(
              "Notifications",
              "Native notification settings can be connected here.",
            )
          }
        />
      </SettingsSection>
      <Button label="Done" onPress={() => router.back()} />
    </ScrollView>
  );
}
