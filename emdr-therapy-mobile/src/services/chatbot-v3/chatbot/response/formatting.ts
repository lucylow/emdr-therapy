export interface FormatChatTextOptions { maxChars?: number; preserveLinks?: boolean; stripMarkdownLinks?: boolean; }
export interface FormattedChatText { text: string; originalChars: number; outputChars: number; changed: boolean; truncated: boolean; removedControls: number; removedLinks: number; }

/** Cleans text for a native text component. It is not an HTML sanitizer and should not be used with WebView HTML. */
export function formatChatDisplayText(value: string, options: FormatChatTextOptions = {}): FormattedChatText {
  const maxChars = bounded(options.maxChars, 3600, 1, 20000);
  const original = String(value ?? '');
  let text = original.normalize('NFC');
  const beforeControls = text.length;
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/gu, '');
  const removedControls = Math.max(0, beforeControls - text.length);
  let removedLinks = 0;
  if (options.preserveLinks !== true && options.stripMarkdownLinks !== false) {
    text = text.replace(/\[([^\]]{1,200})\]\((?:https?:\/\/|mailto:)[^)\s]{1,1000}\)/giu, (_match, label: string) => { removedLinks++; return label; });
    text = text.replace(/\bhttps?:\/\/[^\s<>]+/giu, (_match) => { removedLinks++; return ''; });
  }
  text = text.replace(/\r\n?/gu, '\n').replace(/[ \t]+\n/gu, '\n').replace(/\n{4,}/gu, '\n\n\n').trim();
  let truncated = false;
  if (Array.from(text).length > maxChars) { text = Array.from(text).slice(0, maxChars).join('').trimEnd(); truncated = true; }
  return { text, originalChars: original.length, outputChars: text.length, changed: text !== original, truncated, removedControls, removedLinks };
}

export function splitReadableParagraphs(text: string, maxParagraphs = 8): string[] {
  const limit = bounded(maxParagraphs, 8, 1, 20);
  return String(text ?? '').split(/\n\s*\n/gu).map((part) => part.trim()).filter(Boolean).slice(0, limit);
}
function bounded(value: number | undefined, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback; }
