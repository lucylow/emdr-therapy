import type { Locale } from '../types.ts';
export type LocaleDecisionSource = 'explicit-user-choice' | 'explicit-turn-locale' | 'conversation-lock' | 'strong-text-evidence' | 'default';
export type LocaleDecision = { locale: Locale; source: LocaleDecisionSource; changed: boolean; confidence: number };
const EXPLICIT: Record<string, Locale> = { en:'en', english:'en', anglais:'en', inglés:'en', ingles:'en', fr:'fr', french:'fr', français:'fr', francaise:'fr', francais:'fr', es:'es', spanish:'es', español:'es', espanol:'es', castellano:'es' };
const MARKERS: Record<Locale, RegExp[]> = {
  en: [/\b(the|and|please|what|where|help|with|your|you|can|want|stop|pause|thanks|hello)\b/giu, /\b(what's|don't|can't|I'm|you're)\b/giu],
  fr: [/\b(le|la|les|des|une|est|avec|pour|merci|arrêter|arrête|aide|séance|je|vous|mon|ma|pas)\b/giu, /\b(j'aimerais|qu'est-ce|s'il vous plaît)\b/giu],
  es: [/\b(el|la|los|las|una|es|con|para|gracias|detener|pausar|ayuda|sesión|sesion|quiero|por|favor|mi|no)\b/giu, /\b(por favor|qué tal|buenos días)\b/giu],
};
export class LocaleController {
  private locked?: Locale;
  private chosenByUser = false;
  constructor(private readonly fallback: Locale = 'en', private readonly threshold = 2) {}
  choose(input: { text: string; turnLocale?: Locale; explicitChoice?: string; keepConversationLocale?: boolean }): LocaleDecision {
    if (input.explicitChoice) {
      const normalized = input.explicitChoice.normalize('NFKC').trim().toLocaleLowerCase();
      const locale = EXPLICIT[normalized];
      if (locale) { this.locked = locale; this.chosenByUser = true; return { locale, source: 'explicit-user-choice', changed: true, confidence: 1 }; }
    }
    if (input.turnLocale && isLocale(input.turnLocale)) { this.locked = input.turnLocale; return { locale: input.turnLocale, source: 'explicit-turn-locale', changed: true, confidence: 1 }; }
    if (input.keepConversationLocale !== false && this.locked && this.chosenByUser) return { locale: this.locked, source: 'conversation-lock', changed: false, confidence: 1 };
    const scores = scoreLocales(input.text);
    const ranked = (Object.entries(scores) as Array<[Locale, number]>).sort((a,b) => b[1] - a[1]);
    const [top, score] = ranked[0]!; const second = ranked[1]![1];
    if (score >= this.threshold && score - second >= 1) { const changed = top !== this.locked; this.locked = top; return { locale: top, source: 'strong-text-evidence', changed, confidence: Math.min(0.99, 0.55 + 0.1 * score) }; }
    if (input.keepConversationLocale !== false && this.locked) return { locale: this.locked, source: 'conversation-lock', changed: false, confidence: 0.7 };
    return { locale: this.fallback, source: 'default', changed: false, confidence: 0.4 };
  }
  set(locale: Locale): void { this.locked = locale; this.chosenByUser = true; }
  reset(): void { this.locked = undefined; this.chosenByUser = false; }
  current(): Locale | undefined { return this.locked; }
}
export function scoreLocales(text: string): Record<Locale, number> {
  const normalized = text.normalize('NFKC').toLocaleLowerCase(); const out: Record<Locale, number> = { en: 0, fr: 0, es: 0 };
  for (const locale of ['en','fr','es'] as const) {
    for (const pattern of MARKERS[locale]) {
      pattern.lastIndex = 0;
      const matches = normalized.match(pattern) ?? [];
      out[locale] += new Set(matches.map(x => x.toLocaleLowerCase())).size;
    }
  }
  if (/[¿¡ñ]/u.test(normalized)) out.es += 2;
  if (/[àâçéèêëîïôùûüÿœæ]/u.test(normalized)) out.fr += 1;
  return out;
}
function isLocale(value: string): value is Locale { return value === 'en' || value === 'fr' || value === 'es'; }
