import type { Intent, Locale } from '../types.ts';
import { normalizeText } from '../text.ts';
const NEGATION:Record<Locale,string[]>={en:['do not','dont','not','never','avoid','without','stop saying'],fr:['ne pas','pas','jamais','évite','sans'],es:['no','nunca','sin','evita','no quiero']};
export function isIntentNegated(text:string,intent:Intent,locale:Locale):boolean {
  const s=normalizeText(text);const cues=NEGATION[locale]??NEGATION.en;
  const trigger:Partial<Record<Intent,string[]>>={pause:['pause','pause session','mettre en pause','pausar'],resume:['resume','continue','reprendre','reanudar'],stop:['stop','stop now','end session','arrêter','terminer la séance','detener','terminar sesión'],grounding:['grounding','ancrage','conexión con el presente'],breathing:['breathing','respiration','respiración']};
  if(intent==='stop' && /^(stop|stop now|emergency stop|arrêter|arrêter maintenant|detener|detener ahora)$/u.test(s))return false;
  const terms=trigger[intent]??[];
  return terms.some(term=>{const index=s.indexOf(normalizeText(term));if(index<0)return false;const before=s.slice(Math.max(0,index-32),index);return cues.some(c=>before.includes(normalizeText(c)));});
}
export function stripNegatedClauses(text:string,locale:Locale):string {
  const cues=NEGATION[locale]??NEGATION.en;let result=text;
  for(const cue of cues){const pattern=new RegExp(`\\b${escape(cue)}\\b[^,.!?;]{0,80}(?:[,;]|$)`,'giu');result=result.replace(pattern,' ');}
  return result.replace(/\s+/g,' ').trim();
}
function escape(s:string):string{return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
