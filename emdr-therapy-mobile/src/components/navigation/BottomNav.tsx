import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../ui/Icon";
import { AppText } from "../ui/AppText";
import { colors } from "../../theme/tokens";

const items: Array<{
  label: string;
  href: "/home" | "/sessions" | "/insights" | "/profile";
  icon: IconName;
  active: IconName;
}> = [
  { label: "Home", href: "/home", icon: "home-outline", active: "home" },
  {
    label: "Sessions",
    href: "/sessions",
    icon: "albums-outline",
    active: "albums",
  },
  {
    label: "Insights",
    href: "/insights",
    icon: "analytics-outline",
    active: "analytics",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "person-outline",
    active: "person",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: 66 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {items.map((item) => {
        const selected =
          pathname === item.href || (item.href === "/home" && pathname === "/");
        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${item.label} tab`}
            onPress={() => router.replace(item.href)}
            style={({ pressed }) => [
              styles.item,
              { opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <Icon
              name={selected ? item.active : item.icon}
              color={selected ? colors.forest : colors.mist}
            />
            <AppText
              variant="caption"
              style={{ color: selected ? colors.forest : colors.mist }}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.silk,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  item: {
    minWidth: 68,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
});
