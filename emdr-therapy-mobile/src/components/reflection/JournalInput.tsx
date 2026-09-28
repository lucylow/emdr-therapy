import React from "react";
import { TextInput, View, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";
import { colors, radii, spacing } from "../../theme/tokens";

export function JournalInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View>
      <AppText variant="h3">Private reflection</AppText>
      <TextInput
        accessibilityLabel="Private reflection"
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={4000}
        placeholder="Write a few words…"
        placeholderTextColor={colors.mist}
        style={styles.input}
      />
      <AppText
        variant="caption"
        muted
        style={{ textAlign: "right", marginTop: 4 }}
      >
        {value.length}/4000
      </AppText>
    </View>
  );
}
const styles = StyleSheet.create({
  input: {
    minHeight: 150,
    marginTop: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.ivory,
    borderWidth: 1,
    borderColor: colors.silk,
    padding: spacing.lg,
    color: colors.graphite,
    fontSize: 16,
    lineHeight: 23,
    textAlignVertical: "top",
  },
});
