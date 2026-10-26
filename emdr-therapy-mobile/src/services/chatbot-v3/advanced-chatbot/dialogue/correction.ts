import type { Intent, Locale } from '../types.ts';
import { normalizeText } from '../text.ts';
export type Correction={isCorrection:boolean;replacementIntent?:Intent;confidence:number;reason:string};
const STARTERS:Record<Locale,string[]>={en:['i meant','no i meant','actually','not that','i was asking'],fr:['je voulais dire','non je voulais dire','en fait','pas ça'],es:['quería decir','no quería decir','en realidad','no eso']};
const MAP:Record<Locale,Array<[RegExp,Intent]>>={
 en:[[/\b(privacy|data|delete)\b/u,'privacy'],[/\b(help|settings|app)\b/u,'app_help'],[/\b(emdr|therapy)\b/u,'emdr_definition'],[/\b(grounding|present)\b/u,'grounding'],[/\b(breathing|breathe)\b/u,'breathing'],[/\b(pause)\b/u,'pause'],[/\b(stop|end session)\b/u,'stop']],
 fr:[[/\b(confidentialité|données)\b/u,'privacy'],[/\b(aide|paramètres|application)\b/u,'app_help'],[/\b(emdr|thérapie)\b/u,'emdr_definition'],[/\b(ancrage|présent)\b/u,'grounding'],[/\b(respiration|respirer)\b/u,'breathing'],[/\b(pause)\b/u,'pause'],[/\b(arrêter|terminer)\b/u,'stop']],
 es:[[/\b(privacidad|datos)\b/u,'privacy'],[/\b(ayuda|ajustes|aplicación)\b/u,'app_help'],[/\b(emdr|terapia)\b/u,'emdr_definition'],[/\b(presente|anclaje)\b/u,'grounding'],[/\b(respiración|respirar)\b/u,'breathing'],[/\b(pausa)\b/u,'pause'],[/\b(detener|terminar)\b/u,'stop']],
};
export function parseCorrection(text:string,locale:Locale):Correction {
 const s=normalizeText(text);const starts=STARTERS[locale];if(!starts.some(p=>s.startsWith(normalizeText(p))))return {isCorrection:false,confidence:0,reason:'no-correction-marker'};
 for(const [regex,intent] of MAP[locale])if(regex.test(s))return {isCorrection:true,replacementIntent:intent,confidence:0.78,reason:'correction-marker-and-known-topic'};
 return {isCorrection:true,confidence:0.35,reason:'correction-without-clear-topic'};
}
