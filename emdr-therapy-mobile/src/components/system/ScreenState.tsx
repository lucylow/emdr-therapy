import React from "react";
import { View } from "react-native";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";

export function ScreenState({
  loading,
  error,
  empty,
  onRetry,
  emptyTitle = "Nothing here yet.",
  emptyDescription = "Your saved activity will appear here.",
}: {
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (loading)
    return (
      <View style={{ gap: 12, paddingVertical: 24 }}>
        <LoadingSkeleton height={24} />
        <LoadingSkeleton height={80} />
        <LoadingSkeleton height={80} />
      </View>
    );
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty)
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return null;
}
