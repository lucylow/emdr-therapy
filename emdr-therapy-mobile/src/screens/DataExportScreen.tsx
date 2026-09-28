import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { Card } from "../components/ui/Card";
import { AppText } from "../components/ui/AppText";
import { Button } from "../components/ui/Button";
import { InlineStatus } from "../components/ui/InlineStatus";
import { colors, spacing } from "../theme/tokens";

export function DataExportScreen() {
  const router = useRouter();
  const [requested, setRequested] = useState(false);
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
        eyebrow="DATA EXPORT"
        title="Take a copy with you."
        description="Prepare a portable representation of your saved sessions and reflections."
      />
      <Card>
        <AppText variant="h3">Included</AppText>
        <AppText muted style={{ marginTop: 8 }}>
          Session history
        </AppText>
        <AppText muted style={{ marginTop: 4 }}>
          Saved reflection metadata
        </AppText>
        <AppText muted style={{ marginTop: 4 }}>
          Preferences
        </AppText>
      </Card>
      {requested ? (
        <InlineStatus label="Export request prepared" tone="success" />
      ) : null}
      <Button
        label={requested ? "Export requested" : "Prepare export"}
        onPress={() => setRequested(true)}
      />
      <AppText variant="caption" muted style={{ textAlign: "center" }}>
        The production implementation should create files without placing
        secrets or raw credentials in the export.
      </AppText>
      <Button label="Done" variant="quiet" onPress={() => router.back()} />
    </ScrollView>
  );
}
