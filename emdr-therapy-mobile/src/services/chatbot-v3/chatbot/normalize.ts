export interface NormalizedChatInput {
  text: string;
  normalized: string;
  originalLength: number;
  wasTruncated: boolean;
  wasEmpty: boolean;
  containsControlCharacters: boolean;
}

/** Normalize accidental formatting without changing the user's lexical intent. */
export function normalizeChatInput(input: unknown, maxChars = 2400): NormalizedChatInput {
  const source = typeof input === 'string' ? input : '';
  const containsControlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(source);
  const cleaned = source
    .replace(/[\u200B-\u200D\u2060\uFEFF]/gu, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, '')
    .replace(/\r\n?/gu, '\n')
    .replace(/[\t ]+/gu, ' ')
    .split('\n').map((line) => line.trim()).join('\n')
    .trim();
  const limit = Math.max(1, Math.floor(Number.isFinite(maxChars) ? maxChars : 2400));
  const text = cleaned.slice(0, limit);
  return {
    text,
    normalized: text.toLocaleLowerCase().normalize('NFKC').replace(/[’‘]/gu, "'").replace(/[“”]/gu, '"'),
    originalLength: source.length,
    wasTruncated: cleaned.length > limit,
    wasEmpty: text.length === 0,
    containsControlCharacters,
  };
}

/** Only exact, standalone commands can trigger deterministic session controls. */
export function detectExactChatControl(input: string): 'pause' | 'stop' | 'none' {
  const text = normalizeChatInput(input, 160).normalized.replace(/[.!。！?？]+$/u, '').trim();
  const pause = /^(?:please )?(?:pause|pause now|take a break|hold on|wait|stop for a moment|descanso|pausa|attends|fais une pause|espera|hacer una pausa)(?: please)?$/u;
  const stop = /^(?:please )?(?:stop|stop now|end session|stop the session|turn it off|cancel session|arrête|arrête maintenant|detente|para|detente ahora|fin de sesión)(?: please)?$/u;
  if (stop.test(text)) return 'stop';
  if (pause.test(text)) return 'pause';
  return 'none';
}

export function truncateByCodePoints(text: string, maxCodePoints: number): string {
  const limit = Math.max(0, Math.floor(maxCodePoints));
  return Array.from(text).slice(0, limit).join('');
}

export function countGraphemeApprox(text: string): number {
  // A deterministic no-dependency approximation. UI code should use Intl.Segmenter if available.
  return Array.from(text.normalize('NFC')).filter((char) => !/[\u0300-\u036f\uFE0F\u200D]/u.test(char)).length;
}
