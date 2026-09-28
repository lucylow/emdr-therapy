import React, { useState } from "react";
import { ScrollView } from "react-native";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { PermissionCard } from "../components/ui/PermissionCard";
import { Button } from "../components/ui/Button";
import { requestMicrophone } from "../services/permissions/permissionService";
import { colors, spacing } from "../theme/tokens";

export function PermissionCenterScreen() {
  const [micStatus, setMicStatus] = useState<
    "idle" | "granted" | "denied" | "unavailable"
  >("idle");

  const request = async () => {
    const result = await requestMicrophone();
    setMicStatus(result);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 48,
        backgroundColor: colors.ivory,
        gap: spacing.lg,
      }}
    >
      <ScreenHeader
        eyebrow="PERMISSIONS"
        title="Control what the app can access."
        description="Permissions are requested only when a feature needs them."
      />
      <PermissionCard
        icon="mic-outline"
        title="Optional microphone"
        description="Used for voice-note functionality when the user chooses to record a reflection."
        actionLabel={
          micStatus === "granted" ? "Microphone enabled" : "Allow microphone"
        }
        onAction={request}
      />
      <Button label="Back" variant="quiet" onPress={() => {}} />
    </ScrollView>
  );
}
