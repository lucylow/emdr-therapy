export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function safeString(value: unknown, fallback = "") {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

export function positiveInteger(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1)
    return fallback;
  return Math.floor(value);
}

export function percentage(value: unknown, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, value));
}

export function durationSeconds(value: unknown, fallback = 600) {
  const result = positiveInteger(value, fallback);
  return Math.min(7200, Math.max(30, result));
}

export function sessionId(value: unknown) {
  const result = safeString(value);
  if (!result || result.length > 120 || /[^a-zA-Z0-9_-]/.test(result))
    return null;
  return result;
}
