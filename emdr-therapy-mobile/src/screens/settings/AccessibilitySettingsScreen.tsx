import React from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { SettingRow } from "../../components/settings/SettingRow";
import { SettingsSection } from "../../components/settings/SettingsSection";
import { useAppState } from "../../state/AppStateProvider";
import { colors } from "../../theme/tokens";

export function AccessibilitySettingsScreen() {
  const router = useRouter();
  const { preferences, setPreferences } = useAppState();
  const patch = (partial: Partial<typeof preferences.accessibility>) =>
    setPreferences({
      ...preferences,
      accessibility: { ...preferences.accessibility, ...partial },
    });
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        backgroundColor: colors.ivory,
      }}
    >
      <ScreenHeader
        eyebrow="ACCESSIBILITY"
        title="Comfort and control."
        description="Use settings that make the interface easier to navigate."
      />
      <SettingsSection title="DISPLAY">
        <SettingRow
          icon="play-forward-outline"
          title="Reduce motion"
          subtitle="Simplify animated visual movement"
          value={preferences.accessibility.reduceMotion}
          onValueChange={(value) => patch({ reduceMotion: value })}
        />
        <SettingRow
          icon="text-outline"
          title="Larger text"
          subtitle="Prefer larger interface type"
          value={preferences.accessibility.largerText}
          onValueChange={(value) => patch({ largerText: value })}
        />
        <SettingRow
          icon="contrast-outline"
          title="High contrast"
          subtitle="Increase visual distinction"
          value={preferences.accessibility.highContrast}
          onValueChange={(value) => patch({ highContrast: value })}
        />
      </SettingsSection>
      <SettingRow
        icon="chevron-back"
        title="Back"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}
