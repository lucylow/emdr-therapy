export type ErrorCategory =
  | "network"
  | "audio"
  | "storage"
  | "navigation"
  | "session"
  | "permission"
  | "unknown";

export interface SafeErrorRecord {
  category: ErrorCategory;
  message: string;
  code?: string;
  retryable: boolean;
  timestamp: string;
}

export function normalizeError(
  error: unknown,
  category: ErrorCategory,
): SafeErrorRecord {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong";
  return {
    category,
    message: raw
      .replace(/https?:\/\/\S+/g, "[url]")
      .replace(/Bearer\s+\S+/gi, "[credential]")
      .slice(0, 240),
    retryable: ["network", "audio", "storage"].includes(category),
    timestamp: new Date().toISOString(),
  };
}

export function reportError(record: SafeErrorRecord) {
  if (__DEV__) console.warn(`[${record.category}]`, record.message);
}
