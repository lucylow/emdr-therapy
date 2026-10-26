/** Defensive transient redaction for optional user-triggered sharing. This is not a guarantee of anonymization. */
export interface RedactionResult {
  readonly text: string;
  readonly replacements: number;
  readonly changed: boolean;
  readonly warning: string;
}

const PATTERNS: readonly { name: string; expression: RegExp; replacement: string }[] = [
  { name: 'email', expression: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: '[email]' },
  { name: 'phone', expression: /(?<!\w)(?:\+?\d[\d .()/-]{7,}\d)(?!\w)/g, replacement: '[phone]' },
  { name: 'url', expression: /\bhttps?:\/\/[^\s]+/gi, replacement: '[link]' },
  { name: 'postal-code-ca', expression: /\b[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d\b/gi, replacement: '[postal-code]' },
  { name: 'us-ssn-like', expression: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[id-number]' },
];

export function redactText(input: string, maxCharacters = 6000): RedactionResult {
  let text = String(input ?? '').slice(0, Math.max(0, Math.min(100_000, maxCharacters)));
  let replacements = 0;
  for (const item of PATTERNS) {
    item.expression.lastIndex = 0;
    const matches = text.match(item.expression);
    if (matches) replacements += matches.length;
    text = text.replace(item.expression, item.replacement);
  }
  return {
    text, replacements, changed: replacements > 0,
    warning: 'Automated redaction can miss identifying details. Review every passage before sharing; local processing is preferred.',
  };
}

export function isProbablySensitive(text: string): boolean {
  return PATTERNS.some((item) => { item.expression.lastIndex = 0; return item.expression.test(text); });
}

export function redactObjectStrings<T>(value: T, depth = 0): T {
  if (depth > 10) return undefined as T;
  if (typeof value === 'string') return redactText(value).text as T;
  if (Array.isArray(value)) return value.slice(0, 1000).map((item) => redactObjectStrings(item, depth + 1)) as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (/rawText|journalText|messageBody|transcript|freeText|noteText/i.test(key)) continue;
      result[key] = redactObjectStrings(child, depth + 1);
    }
    return result as T;
  }
  return value;
}
