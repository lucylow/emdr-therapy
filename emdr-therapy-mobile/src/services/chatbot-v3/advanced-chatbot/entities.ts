import type { ExtractedEntity, Locale } from './types.ts';
import { normalizeText } from './text.ts';

const FEATURE_PATTERNS: Array<[string, RegExp]> = [
  ['audio', /\b(audio|sound|volume|son|audio|sonido|volumen)\b/u],
  ['visual', /\b(visual|color|colour|ball|dot|visual|couleur|point|color|punto)\b/u],
  ['speed', /\b(speed|slower|faster|vitesse|lentement|velocidad|despacio)\b/u],
  ['duration', /\b(duration|minutes?|length|durée|minutos?|duración)\b/u],
  ['reduced_motion', /\b(reduced motion|less movement|reduce motion|mouvement réduit|menos movimiento)\b/u],
];
export function extractEntities(text: string, locale: Locale = 'en'): ExtractedEntity[] {
  const s = normalizeText(text); const out: ExtractedEntity[] = [];
  const durations = [...s.matchAll(/\b(\d{1,3})\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|secondes?|minutes?|heures?|segundos?|minutos?|horas?)\b/gu)];
  for (const m of durations) {
    const rawUnit = m[2]; const unit = /^(s|sec|second|seconds|secondes|segundos)/u.test(rawUnit) ? 'seconds' : /^(h|hr|hour|hours|heures|horas)/u.test(rawUnit) ? 'hours' : 'minutes';
    const number = Number(m[1]); if (number >= 1 && number <= 720) out.push({ kind:'duration', value:number, unit, span:[m.index ?? 0, (m.index ?? 0)+m[0].length] });
  }
  const speed = s.match(/\b(\d{1,3})\s*(?:bpm|hz|cycles per minute|cycles?\/min)\b/u);
  if (speed) { const n = Number(speed[1]); if (n >= 1 && n <= 240) out.push({ kind:'speed', value:n, unit: speed[0].includes('hz') ? 'hz' : 'cycles-per-minute' }); }
  if (/\b(quiet|silent|mute|off|désactiver|sin sonido|sin audio)\b/u.test(s)) out.push({ kind:'feature', value:'audio-off' });
  if (/\b(audio on|sound on|with audio|activer le son|activar audio)\b/u.test(s)) out.push({ kind:'feature', value:'audio-on' });
  if (/\b(slower|more slowly|plus lentement|más despacio)\b/u.test(s)) out.push({ kind:'feature', value:'speed-slower' });
  if (/\b(faster|plus vite|más rápido)\b/u.test(s)) out.push({ kind:'feature', value:'speed-faster' });
  for (const [feature, regex] of FEATURE_PATTERNS) if (regex.test(s)) out.push({ kind:'feature', value:feature });
  if (/\b(english|anglais|inglés)\b/u.test(s)) out.push({kind:'language', value:'en'});
  if (/\b(french|français|frances)\b/u.test(s)) out.push({kind:'language', value:'fr'});
  if (/\b(spanish|espagnol|español)\b/u.test(s)) out.push({kind:'language', value:'es'});
  const unique = new Map<string, ExtractedEntity>();
  for (const entity of out) unique.set(`${entity.kind}:${entity.value}:${entity.unit ?? ''}`, entity);
  return [...unique.values()].slice(0, 12);
}
export function hasExplicitNumericValue(entities: ExtractedEntity[], kind: ExtractedEntity['kind']): boolean {
  return entities.some(e => e.kind === kind && typeof e.value === 'number');
}
