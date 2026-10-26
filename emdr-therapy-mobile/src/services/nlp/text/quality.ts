import { normalizeForMatching } from './normalize-base.ts';
import { countWords } from './tokenize.ts';

export interface InputQuality {
  usable: boolean;
  reason: 'ok' | 'empty' | 'mostly_symbols' | 'repeated_characters' | 'too_short' | 'too_long';
  wordCount: number;
  symbolRatio: number;
  repeatedCharacterRatio: number;
}

/** Input quality estimates are only used to ask for clarification, never to judge a person. */
export function assessInputQuality(raw: string, maxChars = 4000): InputQuality {
  const text = String(raw ?? '');
  if (!text.trim()) return make(false, 'empty', 0, 1, 0);
  if (text.length > maxChars) return make(false, 'too_long', countWords(text), 0, 0);
  const alphanumeric = (text.match(/[\p{L}\p{N}]/gu) ?? []).length;
  const symbols = text.length - alphanumeric;
  const symbolRatio = symbols / Math.max(1, text.length);
  const normalized = normalizeForMatching(text);
  const letters = [...normalized].filter((char) => /[\p{L}\p{N}]/u.test(char));
  const repeated = letters.reduce((sum, char, index) => sum + (index > 1 && char === letters[index - 1] && char === letters[index - 2] ? 1 : 0), 0);
  const repeatedCharacterRatio = repeated / Math.max(1, letters.length);
  const words = countWords(text);
  if (symbolRatio > 0.78) return make(false, 'mostly_symbols', words, symbolRatio, repeatedCharacterRatio);
  if (repeatedCharacterRatio > 0.55 && letters.length > 8) return make(false, 'repeated_characters', words, symbolRatio, repeatedCharacterRatio);
  if (words === 1 && normalized.length < 2) return make(false, 'too_short', words, symbolRatio, repeatedCharacterRatio);
  return make(true, 'ok', words, symbolRatio, repeatedCharacterRatio);
}

function make(usable: boolean, reason: InputQuality['reason'], wordCount: number, symbolRatio: number, repeatedCharacterRatio: number): InputQuality {
  return { usable, reason, wordCount, symbolRatio: round(symbolRatio), repeatedCharacterRatio: round(repeatedCharacterRatio) };
}
function round(value: number): number { return Number(value.toFixed(3)); }
