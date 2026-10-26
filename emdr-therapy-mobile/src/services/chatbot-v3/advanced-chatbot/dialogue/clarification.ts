import type { Intent, Locale } from '../types.ts';
export type Clarification={question:string;options:Array<{id:string;label:string;intent:Intent}>;expiresAfterMs:number};
const DEFAULT_OPTIONS:Record<Locale,Array<{id:string;label:string;intent:Intent}>>={
 en:[{id:'app',label:'App settings or controls',intent:'app_help'},{id:'info',label:'General EMDR information',intent:'emdr_definition'},{id:'grounding',label:'Optional grounding tool',intent:'grounding'},{id:'privacy',label:'Privacy and data',intent:'privacy'}],
 fr:[{id:'app',label:'Paramètres ou commandes',intent:'app_help'},{id:'info',label:'Informations générales sur l’EMDR',intent:'emdr_definition'},{id:'grounding',label:'Outil facultatif d’ancrage',intent:'grounding'},{id:'privacy',label:'Confidentialité et données',intent:'privacy'}],
 es:[{id:'app',label:'Ajustes o controles',intent:'app_help'},{id:'info',label:'Información general sobre EMDR',intent:'emdr_definition'},{id:'grounding',label:'Herramienta opcional de conexión con el presente',intent:'grounding'},{id:'privacy',label:'Privacidad y datos',intent:'privacy'}],
};
export function buildClarification(locale:Locale,options=DEFAULT_OPTIONS[locale]):Clarification {
 const questions:Record<Locale,string>={en:'Which of these would be most useful?',fr:'Qu’est-ce qui vous serait le plus utile ?',es:'¿Cuál de estas opciones te resultaría más útil?'};
 return {question:questions[locale],options:options.map(o=>({...o})),expiresAfterMs:90_000};
}
export function resolveOption(id:string,clarification:Clarification):Intent|undefined{return clarification.options.find(o=>o.id===id)?.intent;}
