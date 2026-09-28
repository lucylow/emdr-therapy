import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function ReflectionSummary({
  before,
  after,
  text,
}: {
  before: number;
  after?: number;
  text?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Value label="Before" value={`${before}/10`} />
        <Value
          label="After"
          value={after === undefined ? "—" : `${after}/10`}
        />
        <Value label="Note" value={text ? "Saved" : "None"} />
      </View>
    </View>
  );
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.value}>
      <AppText variant="caption" muted>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={{ marginTop: 3 }}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 4 },
  row: { flexDirection: "row", gap: 8 },
  value: {
    flex: 1,
    backgroundColor: colors.ivory,
    borderRadius: 14,
    padding: spacing.md,
  },
});
