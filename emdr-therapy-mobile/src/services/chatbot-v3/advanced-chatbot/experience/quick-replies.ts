import type { Intent, Locale } from '../types.ts';
export type QuickReply={id:string;label:string;intent:Intent};
const REPLIES:Record<Locale,QuickReply[]>={
 en:[{id:'app-help',label:'App help',intent:'app_help'},{id:'emdr',label:'What is EMDR?',intent:'emdr_definition'},{id:'ground',label:'Grounding option',intent:'grounding'},{id:'privacy',label:'Privacy',intent:'privacy'}],
 fr:[{id:'app-help',label:'Aide de l’application',intent:'app_help'},{id:'emdr',label:'Qu’est-ce que l’EMDR ?',intent:'emdr_definition'},{id:'ground',label:'Option d’ancrage',intent:'grounding'},{id:'privacy',label:'Confidentialité',intent:'privacy'}],
 es:[{id:'app-help',label:'Ayuda de la aplicación',intent:'app_help'},{id:'emdr',label:'¿Qué es EMDR?',intent:'emdr_definition'},{id:'ground',label:'Opción de conexión con el presente',intent:'grounding'},{id:'privacy',label:'Privacidad',intent:'privacy'}],
};
export function quickReplies(locale:Locale,available:readonly Intent[]=['app_help','emdr_definition','grounding','privacy']):QuickReply[]{const allowed=new Set(available);return REPLIES[locale].filter(r=>allowed.has(r.intent)).map(r=>({...r}));}
export function validateQuickReply(reply:QuickReply,allowedIds:ReadonlySet<string>):boolean{return allowedIds.has(reply.id)&&/^[a-z0-9-]{1,40}$/i.test(reply.id)&&reply.label.length<100;}
