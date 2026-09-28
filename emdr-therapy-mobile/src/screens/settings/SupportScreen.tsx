import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Card } from "../../components/ui/Card";
import { AppText } from "../../components/ui/AppText";
import { Button } from "../../components/ui/Button";
import { InlineStatus } from "../../components/ui/InlineStatus";
import { colors, spacing } from "../../theme/tokens";

export function SupportScreen() {
  const [offline, setOffline] = useState(false);
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        backgroundColor: colors.ivory,
        gap: 16,
      }}
    >
      <ScreenHeader
        eyebrow="SUPPORT"
        title="Need help?"
        description="Simple recovery guidance for common mobile-session issues."
      />
      {offline ? (
        <InlineStatus label="Offline mode preview" tone="warning" />
      ) : null}
      <Card>
        <AppText variant="h3">Audio unavailable</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          Check the device output, open Audio & Visual, or continue with the
          visual experience.
        </AppText>
      </Card>
      <Card>
        <AppText variant="h3">Session interrupted</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          The session pauses when the app loses focus so playback does not
          continue unexpectedly.
        </AppText>
      </Card>
      <Card>
        <AppText variant="h3">Offline</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          Local session state can remain available while a network request is
          unavailable.
        </AppText>
        <Button
          label="Preview offline state"
          variant="secondary"
          onPress={() => setOffline(true)}
          style={{ marginTop: 16 }}
        />
      </Card>
      <View style={{ paddingTop: 10 }}>
        <AppText variant="caption" muted style={{ textAlign: "center" }}>
          Support screens must never display journal contents or raw server
          errors.
        </AppText>
      </View>
    </ScrollView>
  );
}
