import type { Locale } from './types.ts';

export function normalizeText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/[\s\-']+/g, ' ').trim();
}
export function tokenize(value: string): string[] {
  return normalizeText(value).split(/\s+/u).filter(Boolean).slice(0, 1000);
}
export function clampText(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').slice(0, max).trim();
}
export function detectLocale(text: string, fallback: Locale = 'en'): Locale {
  const value = ` ${normalizeText(text)} `;
  const markers: Record<Locale, string[]> = {
    en: [' the ', ' what ', ' how ', ' can ', ' please ', 'help me', 'how do', 'stop ', 'pause '],
    fr: [' le ', ' la ', ' les ', ' je ', ' est ', ' comment ', ' aide ', ' arrêter ', ' respire ', ' bonjour '],
    es: [' el ', ' la ', ' los ', ' yo ', ' cómo ', ' ayuda ', ' por favor ', ' detener ', ' respirar ', ' hola '],
  };
  const scores: Record<Locale, number> = { en: 0, fr: 0, es: 0 };
  for (const locale of ['en', 'fr', 'es'] as const) {
    for (const marker of markers[locale]) {
      const normalizedMarker = normalizeText(marker);
      if (normalizedMarker && value.includes(` ${normalizedMarker} `)) scores[locale] += normalizedMarker.includes(' ') ? 2 : 1;
    }
  }
  if (/[àâçéèêëîïôùûüÿœ]/i.test(text)) scores.fr += 2;
  if (/[¿¡ñ]/i.test(text)) scores.es += 2;
  const sorted = (Object.entries(scores) as Array<[Locale, number]>).sort((a,b) => b[1]-a[1]);
  return sorted[0][1] > 0 && sorted[0][1] > sorted[1][1] ? sorted[0][0] : fallback;
}
export function redactSensitiveText(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/\b(?:\+?\d[\d .()/-]{7,}\d)\b/g, '[PHONE]')
    .replace(/\b(?:\d{3}[- ]?\d{2}[- ]?\d{4})\b/g, '[ID]')
    .replace(/https?:\/\/\S+/gi, '[URL]');
}
export function stableHash(text: string): string {
  let hash = 2166136261;
  for (const char of text) { hash ^= char.codePointAt(0) ?? 0; hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function truncateAtBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars + 1);
  const boundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '), cut.lastIndexOf('\n'));
  return cut.slice(0, boundary > maxChars * 0.5 ? boundary + 1 : maxChars).trimEnd();
}
export function hasPromptInjectionSignals(text: string): boolean {
  const n = normalizeText(text);
  const patterns = [
    /ignore (all )?(previous|prior|above) instructions/u,
    /reveal (the )?(system|developer) prompt/u,
    /act as (an )?(unrestricted|uncensored)/u,
    /bypass (the )?(safety|policy|guardrails)/u,
    /print (all )?(secrets|api keys|credentials)/u,
    /forget your rules and/u,
  ];
  return patterns.some(pattern => pattern.test(n));
}
