import type { Locale } from '../types.ts';
import { normalizeText, redactSensitiveText } from '../text.ts';
export type ReflectionTheme='sleep'|'routine'|'support'|'stress'|'calm'|'app-experience'|'other';
export type ReflectionThemeSummary={themes:Array<{theme:ReflectionTheme;count:number}>;locale:Locale;rawTextStored:false;clinicalInference:false;notice:string};
const DICTIONARY:Record<Locale,Record<ReflectionTheme,string[]>>={
 en:{sleep:['sleep','rest','tired','insomnia'],routine:['routine','habit','schedule','daily'],support:['support','friend','family','therapist'],stress:['stress','overwhelmed','busy','pressure'],calm:['calm','relaxed','peaceful','settled'],'app-experience':['app','button','settings','audio','visual'],other:[]},
 fr:{sleep:['sommeil','repos','fatigue','insomnie'],routine:['routine','habitude','horaire','quotidien'],support:['soutien','ami','famille','thérapeute'],stress:['stress','débordé','pression'],calm:['calme','détendu','paisible'],'app-experience':['application','bouton','paramètres','audio','visuel'],other:[]},
 es:{sleep:['sueño','descanso','cansado','insomnio'],routine:['rutina','hábito','horario','diario'],support:['apoyo','amigo','familia','terapeuta'],stress:['estrés','agobiado','presión'],calm:['calma','relajado','tranquilo'],'app-experience':['aplicación','botón','ajustes','audio','visual'],other:[]},
};
/** Extracts broad keyword themes on the caller's device. Never returns or persists the original reflection. */
export function summarizeReflectionLocally(text:string,locale:Locale,consented:boolean):ReflectionThemeSummary|undefined {
 if(!consented)return undefined;const safe=redactSensitiveText(text).slice(0,3000);const normalized=normalizeText(safe);const themes:Array<{theme:ReflectionTheme;count:number}>=[];
 for(const [theme,keywords] of Object.entries(DICTIONARY[locale]) as Array<[ReflectionTheme,string[]]>){const count=keywords.reduce((sum,k)=>sum+(normalized.includes(normalizeText(k))?1:0),0);if(count)themes.push({theme,count});}
 if(!themes.length)themes.push({theme:'other',count:1});
 const notice:Record<Locale,string>={en:'These are broad word themes only; they do not diagnose or measure mental health.',fr:'Il s’agit uniquement de thèmes lexicaux généraux; ils ne posent pas de diagnostic et ne mesurent pas la santé mentale.',es:'Son solo temas generales de palabras; no diagnostican ni miden la salud mental.'};
 return {themes:themes.sort((a,b)=>b.count-a.count).slice(0,5),locale,rawTextStored:false,clinicalInference:false,notice:notice[locale]};
}
