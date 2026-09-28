export function accessibilitySummary(label: string, value?: string) {
  return value ? `${label}: ${value}` : label;
}

export function actionLabel(label: string, context?: string) {
  return context ? `${label}, ${context}` : label;
}
