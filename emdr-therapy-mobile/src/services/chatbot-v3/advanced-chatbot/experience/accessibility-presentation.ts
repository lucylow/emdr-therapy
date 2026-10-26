import type { ChatResponse, Locale } from '../types.ts';
export type AccessibleMessageModel={accessibilityLabel:string;liveRegion:'polite'|'assertive'|'off';importantForAccessibility:'yes'|'no';role:'text'|'alert'|'status';hint?:string;testId:string};
export function accessibleMessageModel(response:ChatResponse):AccessibleMessageModel {
 const safety=response.safetySignal!=='none';const text=response.text.trim().replace(/\s+/g,' ');
 return{accessibilityLabel:text.slice(0,500),liveRegion:safety?'assertive':'polite',importantForAccessibility:'yes',role:safety?'alert':'text',hint:safety?undefined:'Chatbot response',testId:`chat-response-${safeId(response.turnId)}`};
}
export type LocalizedAccessibleControl={id:string;label:string;hint:string;disabled:boolean;destructive?:boolean};
export function localizeLocalizedAccessibleControl(id:string,locale:Locale,disabled=false):LocalizedAccessibleControl|undefined {
 const labels:Record<Locale,Record<string,{label:string;hint:string;destructive?:boolean}>>={
 en:{pause:{label:'Pause session',hint:'Pauses the current visual or audio movement'},resume:{label:'Resume session',hint:'Resumes the paused session'},stop:{label:'Stop session',hint:'Immediately stops current stimulation',destructive:true},settings:{label:'Settings',hint:'Opens session settings'},privacy:{label:'Privacy controls',hint:'Review data and consent settings'},grounding:{label:'Grounding exercise',hint:'Opens a brief present-moment exercise'},breathing:{label:'Breathing guide',hint:'Opens an optional breathing guide'}},
 fr:{pause:{label:'Mettre la séance en pause',hint:'Met en pause le mouvement visuel ou sonore'},resume:{label:'Reprendre la séance',hint:'Reprend la séance en pause'},stop:{label:'Arrêter la séance',hint:'Arrête immédiatement la stimulation',destructive:true},settings:{label:'Paramètres',hint:'Ouvre les paramètres de la séance'},privacy:{label:'Contrôles de confidentialité',hint:'Consulter les données et les consentements'},grounding:{label:'Exercice d’ancrage',hint:'Ouvre un exercice bref pour revenir au présent'},breathing:{label:'Guide de respiration',hint:'Ouvre un guide facultatif de respiration'}},
 es:{pause:{label:'Pausar sesión',hint:'Pausa el movimiento visual o de audio'},resume:{label:'Reanudar sesión',hint:'Reanuda la sesión pausada'},stop:{label:'Detener sesión',hint:'Detiene la estimulación inmediatamente',destructive:true},settings:{label:'Ajustes',hint:'Abre los ajustes de sesión'},privacy:{label:'Controles de privacidad',hint:'Revisa los datos y el consentimiento'},grounding:{label:'Ejercicio para volver al presente',hint:'Abre un ejercicio breve de conexión con el entorno'},breathing:{label:'Guía de respiración',hint:'Abre una guía de respiración opcional'}}};
 const row=labels[locale][id];return row?{id,label:row.label,hint:row.hint,disabled,destructive:row.destructive}:undefined;
}
function safeId(value:string):string{return value.replace(/[^a-z0-9_-]/gi,'').slice(0,60)||'unknown';}
