import { redactSensitiveText } from '../privacy/redaction.ts';
import type { TextAnalysis } from '../types.ts';
import { detectLanguage } from './language.ts';
import { splitSentences, tokenize } from './tokenize.ts';

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;

export function normalizeUserText(raw: unknown, maxChars = 4000, maxTokens = 600): TextAnalysis {
  const rawText = typeof raw === 'string' ? raw : '';
  const wasTruncated = rawText.length > maxChars;
  const bounded = rawText.slice(0, maxChars)
    .replace(CONTROL_CHARS, ' ')
    .replace(INVISIBLE_CHARS, '')
    .normalize('NFKC');
  const scrubbed = redactSensitiveText(bounded);
  const normalizedText = scrubbed.text
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const allTokens = tokenize(normalizedText);
  const tokens = allTokens.slice(0, maxTokens);
  return {
    language: detectLanguage(normalizedText),
    normalizedText,
    tokens,
    sentenceCount: splitSentences(normalizedText).length,
    wasTruncated: wasTruncated || allTokens.length > maxTokens,
    redactions: scrubbed.count,
  };
}

export function normalizeForMatching(text: string): string {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
