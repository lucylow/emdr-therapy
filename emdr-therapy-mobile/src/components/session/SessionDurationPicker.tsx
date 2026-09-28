import React from "react";
import { View } from "react-native";
import { Chip } from "../ui/Chip";
import { AppText } from "../ui/AppText";
import { spacing } from "../../theme/tokens";

const durations = [5, 8, 10, 12, 15, 20];

export function SessionDurationPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View>
      <AppText variant="h3">Session length</AppText>
      <AppText variant="caption" muted style={{ marginTop: 3 }}>
        Choose a duration that fits this moment.
      </AppText>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 14,
        }}
      >
        {durations.map((minutes) => (
          <Chip
            key={minutes}
            label={`${minutes} min`}
            selected={value === minutes}
            onPress={() => onChange(minutes)}
          />
        ))}
      </View>
    </View>
  );
}
