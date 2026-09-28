import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { colors, layout, spacing } from "../../theme/tokens";

export function ScreenContainer({
  children,
  scroll = true,
  ...props
}: { children: React.ReactNode; scroll?: boolean } & Omit<
  ScrollViewProps,
  "children"
>) {
  if (!scroll) return <View style={styles.root}>{children}</View>;
  return (
    <ScrollView
      {...props}
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ivory },
  content: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 48,
  },
});
