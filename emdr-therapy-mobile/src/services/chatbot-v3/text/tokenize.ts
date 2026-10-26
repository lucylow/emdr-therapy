const TOKEN_RE = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)?|[^\s]/gu;

export function tokenize(text: string): string[] {
  if (!text) return [];
  return (text.match(TOKEN_RE) ?? []).map((token) => token.toLocaleLowerCase());
}

export function splitSentences(text: string): string[] {
  const value = String(text ?? '').trim();
  if (!value) return [];
  // Avoid a dependency on Intl.Segmenter so this works consistently on older RN runtimes.
  return value.split(/(?<=[.!?。！？])\s+|[\n\r]+/u).map((s) => s.trim()).filter(Boolean);
}

export function ngrams(tokens: string[], min = 1, max = 3): string[] {
  const result: string[] = [];
  for (let size = min; size <= max; size += 1) {
    for (let i = 0; i <= tokens.length - size; i += 1) {
      result.push(tokens.slice(i, i + size).join(' '));
    }
  }
  return result;
}

export function countWords(text: string): number {
  return tokenize(text).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}
