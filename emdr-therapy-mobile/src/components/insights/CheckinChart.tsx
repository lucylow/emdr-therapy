import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { REFLECTIONS } from "../../data/mock";
import { colors, spacing } from "../../theme/tokens";

export function CheckinChart() {
  return (
    <View style={styles.container}>
      {REFLECTIONS.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption">{item.sessionTitle}</AppText>
            <AppText variant="caption" muted>
              {new Date(item.createdAt).toLocaleDateString()}
            </AppText>
          </View>
          <View style={styles.points}>
            <View style={[styles.dot, { backgroundColor: colors.mist }]} />
            <View style={styles.line} />
            <View style={[styles.dot, { backgroundColor: colors.forest }]} />
          </View>
          <AppText variant="caption" style={{ width: 45, textAlign: "right" }}>
            {item.moodAfter}/10
          </AppText>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  points: { width: 46, flexDirection: "row", alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  line: { height: 2, width: 24, backgroundColor: colors.silk },
});
