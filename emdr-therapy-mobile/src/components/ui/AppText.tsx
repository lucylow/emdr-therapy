import React from "react";
import { Text, type TextProps } from "react-native";
import { colors, typography } from "../../theme/tokens";

type Variant = keyof typeof typography;

export function AppText({
  variant = "body",
  muted = false,
  style,
  children,
  ...props
}: TextProps & {
  variant?: Variant;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Text
      {...props}
      allowFontScaling
      style={[
        typography[variant],
        { color: muted ? colors.mist : colors.graphite },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
