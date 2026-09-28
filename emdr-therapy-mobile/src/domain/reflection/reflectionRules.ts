export interface ReflectionDraft {
  moodBefore?: number;
  moodAfter?: number;
  text?: string;
  audioNote?: string;
}

export function normalizeReflectionText(value: string) {
  return value
    .trim()
    .replace(/\s{3,}/g, " ")
    .slice(0, 4000);
}
export function hasReflectionContent(draft: ReflectionDraft) {
  return Boolean(
    draft.text?.trim() ||
    draft.audioNote?.trim() ||
    draft.moodBefore !== undefined ||
    draft.moodAfter !== undefined,
  );
}
export function safeReflectionPreview(text?: string) {
  if (!text) return "No written reflection";
  const normalized = normalizeReflectionText(text);
  return normalized.length <= 90 ? normalized : `${normalized.slice(0, 87)}…`;
}
