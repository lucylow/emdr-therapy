import type { Intent, Locale, RiskSignal } from '../types.ts';
export type InterruptKind='none'|'direct-stop'|'direct-pause'|'safety'|'privacy-delete'|'user-correction'|'cancel-pending';
export type InterruptDecision={kind:InterruptKind;cancelGeneration:boolean;clearPending:boolean;skipProvider:boolean;priority:number;reason:string};
const PHRASES:Record<Locale,Record<Exclude<InterruptKind,'none'>,string[]>>={
 en:{'direct-stop':['stop','stop now','emergency stop','end session'],'direct-pause':['pause','pause now','pause session'],safety:['i am in immediate danger','i might hurt myself','i do not feel safe'], 'privacy-delete':['delete my data','forget this chat','clear my history'], 'user-correction':['that is not what i meant','i meant','please correct that'], 'cancel-pending':['cancel','never mind','cancel that']},
 fr:{'direct-stop':['arrêter','arrêter maintenant','arrêt d’urgence'], 'direct-pause':['pause','mettre en pause','pause maintenant'],safety:['je suis en danger immédiat','je ne suis pas en sécurité'], 'privacy-delete':['supprimer mes données','oublier cette conversation'], 'user-correction':['ce n’est pas ce que je voulais dire','je voulais dire'], 'cancel-pending':['annuler','laisse tomber']},
 es:{'direct-stop':['detener','detener ahora','parada de emergencia'], 'direct-pause':['pausa','pausar ahora','pausar sesión'],safety:['estoy en peligro inmediato','no estoy a salvo'], 'privacy-delete':['eliminar mis datos','olvida este chat'], 'user-correction':['eso no es lo que quería decir','quería decir'], 'cancel-pending':['cancelar','déjalo']},
};
const PRIORITY:Record<InterruptKind,number>={none:0,'cancel-pending':20,'user-correction':30,'privacy-delete':40,'direct-pause':70,'direct-stop':90,safety:100};
export function detectInterrupt(text:string,locale:Locale,risk:RiskSignal='none'):InterruptDecision {
 let kind:InterruptKind='none';const n=text.normalize('NFKC').toLocaleLowerCase().replace(/[.!?]/g,'').trim();
 if(risk!=='none')kind='safety';
 else for(const candidate of ['direct-stop','direct-pause','privacy-delete','user-correction','cancel-pending'] as const){if(PHRASES[locale][candidate].some(p=>n===p||candidate==='user-correction'&&n.startsWith(p))){kind=candidate;break;}}
 const cancelGeneration=['direct-stop','direct-pause','safety','privacy-delete','user-correction','cancel-pending'].includes(kind);
 return{kind,cancelGeneration,clearPending:['privacy-delete','cancel-pending','direct-stop','safety'].includes(kind),skipProvider:kind!=='none',priority:PRIORITY[kind],reason:kind==='none'?'no-interrupt-detected':`interrupt-${kind}`};
}
export function shouldInterrupt(activePriority:number,next:InterruptDecision):boolean{return next.cancelGeneration&&next.priority>=activePriority;}
