const sensitiveKeyPattern =
  /(token|secret|password|authorization|cookie|phone|email|transcript|reflection|journal)/i;

export function redactObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactObject);
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    Object.entries(input).forEach(([key, item]) => {
      output[key] = sensitiveKeyPattern.test(key)
        ? "[redacted]"
        : redactObject(item);
    });
    return output;
  }
  return value;
}

export function redactError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message.slice(0, 240) };
  }
  return { name: "Error", message: "Unexpected error" };
}

export function redactForTelemetry(value: unknown) {
  return JSON.stringify(redactObject(value));
}
