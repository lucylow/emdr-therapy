/** Conservative scrubber for accidental diagnostics. It does not make text anonymous. */
export interface RedactionResult {
  text: string;
  count: number;
  categories: string[];
}

const RULES: Array<{ category: string; pattern: RegExp; replacement: string }> = [
  { category: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: '[email]' },
  { category: 'url', pattern: /\b(?:https?:\/\/|www\.)[^\s<>]+/gi, replacement: '[link]' },
  { category: 'phone', pattern: /(?<!\w)(?:\+?\d[\d().\- ]{7,}\d)(?!\w)/g, replacement: '[phone]' },
  { category: 'long_number', pattern: /\b\d{7,}\b/g, replacement: '[number]' },
];

export function redactSensitiveText(input: string): RedactionResult {
  let text = input;
  const categories: string[] = [];
  let count = 0;
  for (const rule of RULES) {
    let found = false;
    text = text.replace(rule.pattern, () => {
      count += 1;
      found = true;
      return rule.replacement;
    });
    if (found) categories.push(rule.category);
  }
  return { text, count, categories };
}

/** Scrub common contact details from user-authored text before it reaches a model adapter. */
export function scrubForModel(input: string, maxChars = 2000): RedactionResult {
  const bounded = String(input ?? '').slice(0, Math.max(0, maxChars));
  return redactSensitiveText(bounded);
}
