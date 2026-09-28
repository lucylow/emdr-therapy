import React from "react";
import { View } from "react-native";
import { AppText } from "../ui/AppText";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";

export function InsightPlaceholder({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <View style={{ gap: 10 }}>
      <LoadingSkeleton width={110} height={12} />
      <LoadingSkeleton width="82%" height={22} />
      <LoadingSkeleton width="94%" height={14} />
      <LoadingSkeleton width="68%" height={14} />
      <AppText variant="caption" muted>
        Preparing a descriptive activity summary…
      </AppText>
    </View>
  );
}
