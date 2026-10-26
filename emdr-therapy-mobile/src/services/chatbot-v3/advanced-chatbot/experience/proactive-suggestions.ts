import type { Intent, Locale } from '../types.ts';
export type ProactiveSuggestion={id:string;intent:Intent;label:string;reason:string;optional:true};
/** No automatic or unsolicited mental-health nudges; this offers opt-in app discovery only. */
const SUGGESTIONS:Record<Locale,ProactiveSuggestion[]>={
 en:[{id:'privacy',intent:'privacy',label:'Review privacy options',reason:'user-opened-chat-help',optional:true},{id:'app-tour',intent:'app_help',label:'Explore app controls',reason:'user-opened-chat-help',optional:true},{id:'grounding',intent:'grounding',label:'See an optional grounding tool',reason:'user-opened-wellbeing-tools',optional:true}],
 fr:[{id:'privacy',intent:'privacy',label:'Consulter la confidentialité',reason:'user-opened-chat-help',optional:true},{id:'app-tour',intent:'app_help',label:'Découvrir les commandes',reason:'user-opened-chat-help',optional:true},{id:'grounding',intent:'grounding',label:'Voir un outil facultatif d’ancrage',reason:'user-opened-wellbeing-tools',optional:true}],
 es:[{id:'privacy',intent:'privacy',label:'Revisar la privacidad',reason:'user-opened-chat-help',optional:true},{id:'app-tour',intent:'app_help',label:'Explorar controles',reason:'user-opened-chat-help',optional:true},{id:'grounding',intent:'grounding',label:'Ver una herramienta opcional',reason:'user-opened-wellbeing-tools',optional:true}],
};
export function getOptInSuggestions(locale:Locale,entryPoint:'user-opened-chat-help'|'user-opened-wellbeing-tools'|undefined,limit=2):ProactiveSuggestion[] {
 if(!entryPoint||limit<=0)return [];return SUGGESTIONS[locale].filter(s=>s.reason===entryPoint).slice(0,Math.min(3,limit)).map(s=>({...s}));
}
export function isProactiveSuggestionSafe(s:ProactiveSuggestion):boolean{return s.optional===true&&['privacy','app_help','grounding'].includes(s.intent)&&s.label.length<=100;}
