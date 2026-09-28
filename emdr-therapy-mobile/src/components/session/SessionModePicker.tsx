import React from "react";
import { View } from "react-native";
import { Chip } from "../ui/Chip";
import { AppText } from "../ui/AppText";

const modes = [
  { value: "combined", label: "Audio + Visual" },
  { value: "audio", label: "Audio only" },
  { value: "visual", label: "Visual only" },
] as const;

export type SessionMode = (typeof modes)[number]["value"];

export function SessionModePicker({
  value,
  onChange,
}: {
  value: SessionMode;
  onChange: (value: SessionMode) => void;
}) {
  return (
    <View>
      <AppText variant="h3">Experience</AppText>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
        }}
      >
        {modes.map((mode) => (
          <Chip
            key={mode.value}
            label={mode.label}
            selected={value === mode.value}
            onPress={() => onChange(mode.value)}
          />
        ))}
      </View>
    </View>
  );
}
