import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { IconButton } from "../ui/IconButton";
import { colors, spacing } from "../../theme/tokens";
import { formatDuration } from "../../utils/date";

export function SessionProgressHeader({
  title,
  elapsed,
  total,
  onClose,
}: {
  title: string;
  elapsed: number;
  total: number;
  onClose: () => void;
}) {
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;

  return (
    <View>
      <View style={styles.row}>
        <IconButton
          icon="close"
          label="End session"
          onPress={onClose}
          tone="inverse"
        />
        <View style={styles.center}>
          <AppText variant="caption" style={{ color: "#CACACE" }}>
            {title}
          </AppText>
          <AppText variant="caption" style={{ color: "#85858B", marginTop: 2 }}>
            {formatDuration(elapsed)} / {formatDuration(total)}
          </AppText>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <View
        accessible
        accessibilityLabel={`${Math.round(progress * 100)} percent complete`}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.meta}>
        <AppText variant="caption" style={{ color: "#85858B" }}>
          Session progress
        </AppText>
        <AppText variant="caption" style={{ color: "#BEBEC3" }}>
          {Math.round(progress * 100)}%
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  center: { flex: 1, alignItems: "center" },
  track: {
    height: 4,
    backgroundColor: "#323236",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: spacing.md,
  },
  fill: {
    height: "100%",
    backgroundColor: colors.forestLight,
    borderRadius: 2,
  },
  meta: { flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
});
