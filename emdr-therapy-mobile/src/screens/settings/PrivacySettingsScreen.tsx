import React from "react";
import { Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Card } from "../../components/ui/Card";
import { AppText } from "../../components/ui/AppText";
import { SettingRow } from "../../components/settings/SettingRow";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { Button } from "../../components/ui/Button";
import { colors } from "../../theme/tokens";
import {
  clearAllLocalData,
  getLocalDataExportWithStatus,
} from "../../../lib/session-store";

export function PrivacySettingsScreen() {
  const router = useRouter();
  const previewExport = async () => {
    try {
      const data = await getLocalDataExportWithStatus();
      if (data.usedFallback) {
        Alert.alert(
          "Local summary unavailable",
          "Some device data could not be read. Nothing was uploaded or changed. Try again later.",
        );
        return;
      }
      Alert.alert(
        "On-device data summary",
        `${data.sessions.length} session summaries · ${data.journal.length} journal notes · ${data.breathing.length} breathing practices\n\nThis preview stays on this device; it does not create or upload a file.`,
      );
    } catch {
      Alert.alert(
        "Local summary unavailable",
        "Nothing was uploaded or changed. Try again later.",
      );
    }
  };
  const confirmDelete = () =>
    Alert.alert(
      "Delete all local data?",
      "This removes saved session summaries, check-ins, reflections, preferences, and safety-plan data from this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete local data",
          style: "destructive",
          onPress: () => {
            void clearAllLocalData().then((deleted) =>
              Alert.alert(
                deleted ? "Local data deleted" : "Deletion incomplete",
                deleted
                  ? "App-managed data has been removed from this device. Data outside this app is unaffected."
                  : "Some app data may remain on this device. Retry from Settings when ready.",
              ),
            );
          },
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
            Data is stored locally in AsyncStorage, which this app does not
            encrypt. Cloud sync is off. Avoid detailed trauma narratives and
            identifiers, especially on a shared device.
          </AppText>
          <AppText muted style={{ marginTop: 8 }}>
            The current summary action previews data but does not create an export file. Device-backup behavior has not been verified. Deleting app-managed data cannot promise removal of copies or backups outside the app.
          </AppText>
      </Card>
      <SettingsSection title="DATA CONTROLS">
        <SettingRow
          icon="download-outline"
          title="Preview local data summary"
          subtitle="Show record counts; no file is created or uploaded"
          onPress={() => void previewExport()}
        />
        <SettingRow
          icon="trash-outline"
          title="Delete all local data"
          subtitle="Permanently remove app-managed data from this device"
          onPress={confirmDelete}
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
