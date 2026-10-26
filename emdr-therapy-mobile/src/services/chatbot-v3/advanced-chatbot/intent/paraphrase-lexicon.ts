import type { Intent, Locale } from '../types.ts';
export type LexiconEntry={canonical:string;intent:Intent;locale:Locale;variants:string[]};
export const PARAPHRASE_LEXICON:readonly LexiconEntry[]=Object.freeze([
 {canonical:'pause',intent:'pause',locale:'en',variants:['hold on','take a pause','put it on hold','stop for a moment']},
 {canonical:'stop',intent:'stop',locale:'en',variants:['end it now','quit the session','emergency halt']},
 {canonical:'resume',intent:'resume',locale:'en',variants:['continue where we left off','carry on','start again']},
 {canonical:'grounding',intent:'grounding',locale:'en',variants:['help me get present','orient me to the room','feel connected to now']},
 {canonical:'breathing',intent:'breathing',locale:'en',variants:['breath practice','paced breathing','slow my breathing']},
 {canonical:'privacy',intent:'privacy',locale:'en',variants:['data controls','my information','clear my history']},
 {canonical:'pause',intent:'pause',locale:'fr',variants:['faire une pause','mettre sur pause','pause un instant']},
 {canonical:'stop',intent:'stop',locale:'fr',variants:['terminer maintenant','arrêt immédiat','stopper la séance']},
 {canonical:'resume',intent:'resume',locale:'fr',variants:['continuer là où on en était','reprendre là où on était']},
 {canonical:'grounding',intent:'grounding',locale:'fr',variants:['revenir au moment présent','me reconnecter à la pièce']},
 {canonical:'breathing',intent:'breathing',locale:'fr',variants:['respiration rythmée','ralentir ma respiration']},
 {canonical:'privacy',intent:'privacy',locale:'fr',variants:['contrôle des données','effacer mon historique']},
 {canonical:'pause',intent:'pause',locale:'es',variants:['hacer una pausa','poner en pausa','espera un momento']},
 {canonical:'stop',intent:'stop',locale:'es',variants:['terminar ahora','parar inmediatamente','finalizar la sesión']},
 {canonical:'resume',intent:'resume',locale:'es',variants:['continuar donde estábamos','seguir de nuevo']},
 {canonical:'grounding',intent:'grounding',locale:'es',variants:['volver al momento presente','conectar con mi entorno']},
 {canonical:'breathing',intent:'breathing',locale:'es',variants:['respiración pausada','ralentizar mi respiración']},
 {canonical:'privacy',intent:'privacy',locale:'es',variants:['control de datos','borrar mi historial']},
]);
function normalize(s:string):string{return s.normalize('NFKC').toLocaleLowerCase().replace(/[’']/g,'’').replace(/[^\p{L}\p{N}]+/gu,' ').trim();}
export function matchParaphrase(text:string,locale:Locale):{intent:Intent;canonical:string;variant:string}|undefined {const input=normalize(text);if(!input||input.length>200)return undefined;for(const row of PARAPHRASE_LEXICON){if(row.locale!==locale)continue;for(const variant of row.variants){const v=normalize(variant);if(input===v)return{intent:row.intent,canonical:row.canonical,variant};}}return undefined;}
export function lexiconCoverage(locale:Locale):{entries:number;variants:number;byIntent:Record<string,number>}{const rows=PARAPHRASE_LEXICON.filter(x=>x.locale===locale);const byIntent:Record<string,number>={};for(const row of rows)byIntent[row.intent]=(byIntent[row.intent]??0)+row.variants.length;return{entries:rows.length,variants:rows.reduce((n,r)=>n+r.variants.length,0),byIntent};}
