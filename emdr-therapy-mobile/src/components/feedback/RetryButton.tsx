import React, { useState } from "react";
import { Button } from "../ui/Button";

export function RetryButton({
  onRetry,
  label = "Try Again",
}: {
  onRetry: () => Promise<void> | void;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onRetry();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button label={label} loading={loading} onPress={() => void handle()} />
  );
}
