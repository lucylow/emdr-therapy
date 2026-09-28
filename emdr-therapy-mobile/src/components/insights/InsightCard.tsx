import React from "react";
import { Card } from "../ui/Card";
import { AppText } from "../ui/AppText";
import { colors, spacing } from "../../theme/tokens";

export function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card style={{ backgroundColor: colors.forestPale }}>
      <AppText variant="h3">{title}</AppText>
      <AppText muted style={{ marginTop: spacing.sm }}>
        {description}
      </AppText>
    </Card>
  );
}
