import type { DialogueSnapshot, Intent, Locale } from '../types.ts';
import { normalizeText } from '../text.ts';

const POSITIVE: Record<Locale, string[]> = {
  en:['yes','yep','yeah','sure','okay','ok','confirm','do that','sounds good'],
  fr:['oui','daccord','d accord','bien sûr','confirmer','vas y'],
  es:['sí','si','claro','vale','de acuerdo','confirmar','hazlo'],
};
const NEGATIVE: Record<Locale, string[]> = {
  en:['no','nope','cancel','never mind','dont','do not'],
  fr:['non','annuler','laisse tomber','ne le fais pas'],
  es:['no','cancelar','olvídalo','no lo hagas'],
};
export type FollowUpKind = 'affirmative' | 'negative' | 'repeat' | 'slower' | 'faster' | 'previous-topic' | 'none';
export function resolveFollowUp(text: string, snapshot: DialogueSnapshot, locale: Locale): { kind:FollowUpKind; intent?:Intent; shouldConsumePending:boolean } {
  const value = normalizeText(text);
  if ((POSITIVE[locale] ?? POSITIVE.en).some(t => value === normalizeText(t))) return {kind:'affirmative', shouldConsumePending:!!snapshot.pending};
  if ((NEGATIVE[locale] ?? NEGATIVE.en).some(t => value === normalizeText(t))) return {kind:'negative', shouldConsumePending:!!snapshot.pending};
  if (/^(repeat|again|répète|otra vez|repite)$/u.test(value)) return {kind:'repeat', intent:snapshot.lastIntent, shouldConsumePending:false};
  if (/\b(slower|more slowly|plus lentement|más despacio)\b/u.test(value)) return {kind:'slower', intent:'adjust_speed', shouldConsumePending:false};
  if (/\b(faster|plus vite|más rápido)\b/u.test(value)) return {kind:'faster', intent:'adjust_speed', shouldConsumePending:false};
  if (/^(and that|what about that|for that one|et ça|y eso)$/u.test(value)) return {kind:'previous-topic', intent:snapshot.lastIntent, shouldConsumePending:false};
  return {kind:'none', shouldConsumePending:false};
}
export function isUnambiguousYes(text:string, locale:Locale):boolean {
  const v=normalizeText(text); return (POSITIVE[locale] ?? POSITIVE.en).some(t=>normalizeText(t)===v);
}
export function isUnambiguousNo(text:string, locale:Locale):boolean {
  const v=normalizeText(text); return (NEGATIVE[locale] ?? NEGATIVE.en).some(t=>normalizeText(t)===v);
}
