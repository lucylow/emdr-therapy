import type { Locale } from '../types.ts';
export type AccessibleControl={id:string;label:string;hint:string;role:'button'|'switch'|'link';destructive:boolean;minimumTouchTarget:44;};
const LABELS:Record<Locale,Record<string,{label:string;hint:string}>>={
 en:{pause:{label:'Pause stimulation',hint:'Pauses the current visual or audio sequence.'},resume:{label:'Resume stimulation',hint:'Resumes only after you choose to continue.'},stop:{label:'Stop stimulation',hint:'Stops stimulation immediately. Available even if the chatbot is offline.'},settings:{label:'Settings',hint:'Review app settings and accessibility options.'}},
 fr:{pause:{label:'Mettre la stimulation en pause',hint:'Met en pause la séquence visuelle ou audio actuelle.'},resume:{label:'Reprendre la stimulation',hint:'Reprend uniquement après votre choix.'},stop:{label:'Arrêter la stimulation',hint:'Arrête immédiatement. Disponible même si le chatbot est hors ligne.'},settings:{label:'Paramètres',hint:'Consultez les paramètres et options d’accessibilité.'}},
 es:{pause:{label:'Pausar estimulación',hint:'Pausa la secuencia visual o de audio actual.'},resume:{label:'Reanudar estimulación',hint:'Solo reanuda cuando eliges continuar.'},stop:{label:'Detener estimulación',hint:'Detiene de inmediato. Está disponible aunque el chatbot no funcione.'},settings:{label:'Ajustes',hint:'Revisa los ajustes y las opciones de accesibilidad.'}},
};
export function accessibleControl(id:'pause'|'resume'|'stop'|'settings',locale:Locale):AccessibleControl {
 const l=LABELS[locale][id];return {id,label:l.label,hint:l.hint,role:'button',destructive:id==='stop',minimumTouchTarget:44};
}
export function auditAccessibleControl(control:AccessibleControl):string[] {const errors:string[]=[];if(!control.label.trim())errors.push('missing-label');if(control.label.length>100)errors.push('label-too-long');if(control.hint.length<8)errors.push('hint-too-short');if(control.minimumTouchTarget<44)errors.push('touch-target-too-small');if(control.destructive&&control.id!=='stop')errors.push('unexpected-destructive-control');return errors;}
