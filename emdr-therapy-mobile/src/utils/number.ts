export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function percent(value: number, digits = 0) {
  const safe = clamp(value, 0, 1) * 100;
  return `${safe.toFixed(digits)}%`;
}

export function roundToStep(value: number, step: number, min = 0, max = 100) {
  const safe = clamp(value, min, max);
  if (step <= 0) return safe;
  const rounded = Math.round((safe - min) / step) * step + min;
  return clamp(rounded, min, max);
}

export function safeRatio(numerator: number, denominator: number) {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  )
    return 0;
  return clamp(numerator / denominator, 0, 1);
}
