import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Icon } from "../ui/Icon";
import { colors } from "../../theme/tokens";

export function FavoriteButton({
  favorite,
  onPress,
}: {
  favorite: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        favorite ? "Remove from favorites" : "Add to favorites"
      }
      onPress={onPress}
      style={styles.button}
    >
      <Icon
        name={favorite ? "heart" : "heart-outline"}
        color={favorite ? colors.lavender : colors.mist}
        size={20}
      />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
