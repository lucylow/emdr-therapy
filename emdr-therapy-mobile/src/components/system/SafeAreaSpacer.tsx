import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SafeAreaSpacer({
  position = "top",
}: {
  position?: "top" | "bottom";
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ height: position === "top" ? insets.top : insets.bottom }} />
  );
}
