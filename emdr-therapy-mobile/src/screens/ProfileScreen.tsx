import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { BottomNav } from "../components/navigation/BottomNav";
import { TopStatusBar } from "../components/navigation/TopStatusBar";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { Card } from "../components/ui/Card";
import { AppText } from "../components/ui/AppText";
import { SettingRow } from "../components/settings/SettingRow";
import { SettingsSection } from "../components/settings/SettingsSection";
import { useAppState } from "../state/AppStateProvider";
import { colors } from "../theme/tokens";

export function ProfileScreen() {
  const router = useRouter();
  const { profileName, preferences, setPreferences, resetDemo } = useAppState();
  const toggleHaptics = (value: boolean) =>
    setPreferences({ ...preferences, hapticsEnabled: value });
  return (
    <View style={styles.root}>
      <TopStatusBar />
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          eyebrow="PROFILE"
          title={profileName}
          description="Your personal space and preferences."
        />
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText
              style={{ color: colors.white, fontSize: 26, fontWeight: "800" }}
            >
              A
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="h3">{profileName}</AppText>
            <AppText variant="caption" muted style={{ marginTop: 3 }}>
              Personal space
            </AppText>
          </View>
        </Card>

        <SettingsSection title="SESSION">
          <SettingRow
            icon="musical-notes-outline"
            title="Audio & Visual"
            subtitle="Sound, visual mode, and intensity"
            onPress={() => router.push("/settings/audio")}
          />
          <SettingRow
            icon="accessibility-outline"
            title="Accessibility"
            subtitle="Motion, text size, and contrast"
            onPress={() => router.push("/settings/accessibility")}
          />
        </SettingsSection>

        <SettingsSection title="PRIVACY">
          <SettingRow
            icon="lock-closed-outline"
            title="Privacy"
            subtitle="Data controls and deletion"
            onPress={() => router.push("/settings/privacy")}
          />
          <SettingRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Session reminders"
            onPress={() => router.push("/notifications")}
          />
          <SettingRow
            icon="download-outline"
            title="Export data"
            subtitle="Prepare a portable copy"
            onPress={() => router.push("/data-export")}
          />
        </SettingsSection>

        <SettingsSection title="SUPPORT">
          <SettingRow
            icon="help-circle-outline"
            title="Help & support"
            subtitle="Troubleshooting and app support"
            onPress={() => router.push("/settings/support")}
          />
        </SettingsSection>

        <SettingsSection title="QUICK CONTROLS">
          <SettingRow
            icon="notifications-outline"
            title="Session reminders"
            subtitle="Every evening at 8:00 PM"
            value={true}
            onValueChange={() => {}}
          />
          <SettingRow
            icon="hand-left-outline"
            title="Haptics"
            subtitle={preferences.hapticsEnabled ? "Enabled" : "Off"}
            value={preferences.hapticsEnabled}
            onValueChange={toggleHaptics}
          />
        </SettingsSection>

        <SettingRow
          icon="refresh-outline"
          title="Reset demo data"
          subtitle="Restore the representative mock account"
          onPress={() => void resetDemo()}
        />
        <AppText
          variant="caption"
          muted
          style={{ textAlign: "center", marginTop: 10 }}
        >
          EMDR FLOW AI • Mobile redesign
        </AppText>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  content: { padding: 20, paddingBottom: 140, gap: 18 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 18 },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.graphite,
    alignItems: "center",
    justifyContent: "center",
  },
});
