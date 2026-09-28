import React from "react";
import { View } from "react-native";
import { Chip } from "../ui/Chip";
import { MOOD_OPTIONS } from "../../data/mock";
import { spacing } from "../../theme/tokens";

export function MoodSelector({
  value,
  onChange,
}: {
  value?: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {MOOD_OPTIONS.map((option) => (
        <Chip
          key={option.id}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
