import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { colors, spacing } from "../../theme/tokens";

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <View />
      </Pressable>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <AppText variant="h2">{title}</AppText>
        <AppText muted style={{ marginTop: spacing.sm }}>
          {message}
        </AppText>
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          variant="danger"
          style={{ marginTop: spacing.xl }}
        />
        <Button label="Cancel" onPress={onCancel} variant="quiet" />
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    paddingBottom: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.silk,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
});
