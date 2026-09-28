import React from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { IconButton } from "./IconButton";
import { AppText } from "./AppText";

export function BackHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <IconButton
        icon="chevron-back"
        label="Back"
        onPress={() => router.back()}
      />
      <AppText variant="bodyStrong" style={{ flex: 1, textAlign: "center" }}>
        {title}
      </AppText>
      <View style={{ width: 44 }} />
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 44 },
});
