import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "../ui/Chip";
import { spacing } from "../../theme/tokens";

export function DateRangeChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const options = ["7 days", "30 days", "90 days", "All time"];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((item) => (
        <Chip
          key={item}
          label={item}
          selected={value === item}
          onPress={() => onChange(item)}
        />
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingRight: 20 },
});
