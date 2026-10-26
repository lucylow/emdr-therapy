import type { Intent, IntentCandidate, Locale } from '../types.ts';
import { normalizeText, tokenize } from '../text.ts';
const SAFE_FUZZY_TARGETS:Record<Locale,Partial<Record<Intent,string[]>>>= {
 en:{app_help:['settings','application','features'],emdr_definition:['emdr','reprocessing'],grounding:['grounding','present'],breathing:['breathing','respiration'],privacy:['privacy','confidentiality'],feedback:['feedback','problem']},
 fr:{app_help:['paramètres','application','fonctionnalités'],emdr_definition:['emdr','retraitement'],grounding:['ancrage','présent'],breathing:['respiration'],privacy:['confidentialité','données'],feedback:['avis','problème']},
 es:{app_help:['ajustes','aplicación','funciones'],emdr_definition:['emdr','reprocesamiento'],grounding:['presente','anclaje'],breathing:['respiración'],privacy:['privacidad','datos'],feedback:['comentarios','problema']},
};
/** Conservative spell repair for non-control intent nouns. Never infers STOP/PAUSE/RESUME. */
export function fuzzyIntentCandidates(text:string,locale:Locale):IntentCandidate[] {
 const tokens=tokenize(text);const out:IntentCandidate[]=[];
 for(const [intent,terms] of Object.entries(SAFE_FUZZY_TARGETS[locale]) as Array<[Intent,string[]]>) {
  let best=0;const evidence:string[]=[];
  for(const token of tokens){if(token.length<5)continue;for(const term of terms){const target=normalizeText(term);if(Math.abs(token.length-target.length)>1)continue;const distance=editDistanceAtMostOne(token,target);if(distance===1&&best<0.47){best=0.47;evidence.push(`near:${token}->${target}`);}else if(distance===0&&best<0.6){best=0.6;evidence.push(`exact-token:${target}`);}}}
  if(best)out.push({intent,score:best,evidence:evidence.slice(0,3)});
 }
 return out.sort((a,b)=>b.score-a.score).slice(0,3);
}
export function editDistanceAtMostOne(a:string,b:string):0|1|2 {
 if(a===b)return 0;if(Math.abs(a.length-b.length)>1)return 2;
 let i=0,j=0,edits=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}edits++;if(edits>1)return 2;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}}
 if(i<a.length||j<b.length)edits++;return edits<=1?1:2;
}
