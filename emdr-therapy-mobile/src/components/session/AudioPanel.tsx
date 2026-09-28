import React from "react";
import { View, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Waveform } from "./Waveform";
import { colors, spacing } from "../../theme/tokens";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioPanel({
  title,
  elapsed,
  total,
  progress,
  playing,
  unavailable,
  onPlayPause,
  onOpenSettings,
}: {
  title: string;
  elapsed: number;
  total: number;
  progress: number;
  playing: boolean;
  unavailable?: boolean;
  onPlayPause: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.icon}>
            <Icon name="headset-outline" size={18} color={colors.forest} />
          </View>
          <View>
            <AppText variant="bodyStrong">{title}</AppText>
            <AppText variant="caption" muted>
              {unavailable
                ? "Audio unavailable"
                : playing
                  ? "Audio is playing"
                  : "Audio is paused"}
            </AppText>
          </View>
        </View>
        <AppText
          variant="caption"
          style={{ color: unavailable ? colors.danger : colors.forest }}
        >
          {unavailable ? "Fallback" : "Synced"}
        </AppText>
      </View>
      <Waveform progress={progress} active={playing && !unavailable} />
      <View style={styles.timeline}>
        <AppText variant="caption" muted>
          {formatTime(elapsed)}
        </AppText>
        <AppText variant="caption" muted>
          {formatTime(total)}
        </AppText>
      </View>
      {unavailable ? (
        <View style={styles.fallback}>
          <AppText variant="bodyStrong">Continue without audio</AppText>
          <AppText variant="caption" muted style={{ marginTop: 4 }}>
            Your visual experience can continue.
          </AppText>
          <Button
            label="Audio Settings"
            variant="secondary"
            onPress={onOpenSettings}
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : (
        <Button
          label={playing ? "Pause Audio" : "Play Audio"}
          variant="secondary"
          onPress={onPlayPause}
        />
      )}
    </Card>
  );
}
const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.forestPale,
    alignItems: "center",
    justifyContent: "center",
  },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  fallback: { paddingTop: spacing.md },
});
