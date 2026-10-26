import type { Locale } from '../types.ts';
import type { RetainedDataScope } from './retention-controller.ts';
export type LocalDataItem={id:string;purpose:string;storage:'memory-only'|'local-opt-in'|'aggregate-only';containsRawText:boolean;deletionScope:RetainedDataScope;defaultEnabled:boolean};
export type ManifestAudit={items:number;missingDeletionScopes:RetainedDataScope[];unsafeRawTextItems:string[];ready:boolean};

/** Transparent data inventory for the chatbot integration screen. Host storage implementations must follow it. */
export const LOCAL_CHAT_DATA_MANIFEST:readonly LocalDataItem[]=[
 {id:'turn-context',purpose:'Temporary turns needed for the active view',storage:'memory-only',containsRawText:false,deletionScope:'turn-context',defaultEnabled:true},
 {id:'preferences',purpose:'User-approved language and display preferences',storage:'local-opt-in',containsRawText:false,deletionScope:'preferences',defaultEnabled:false},
 {id:'metrics',purpose:'Count-only quality totals with small-cohort suppression',storage:'aggregate-only',containsRawText:false,deletionScope:'metrics',defaultEnabled:false},
 {id:'cached-answers',purpose:'Reviewed answers reused to reduce repeated retrieval work',storage:'memory-only',containsRawText:false,deletionScope:'cached-answers',defaultEnabled:true},
 {id:'consent-receipts',purpose:'Purpose-specific consent and disclosure version',storage:'local-opt-in',containsRawText:false,deletionScope:'consent-receipts',defaultEnabled:false},
 {id:'pending-actions',purpose:'Short-lived proposed action and confirmation token',storage:'memory-only',containsRawText:false,deletionScope:'turn-context',defaultEnabled:true},
 {id:'correction-intents',purpose:'Short-lived corrected intent label, without correction text',storage:'memory-only',containsRawText:false,deletionScope:'turn-context',defaultEnabled:true},
 {id:'provider-cache',purpose:'Optional response cache key; must not include prompts or personal text',storage:'memory-only',containsRawText:false,deletionScope:'cached-answers',defaultEnabled:false},
];
const COPY:Record<Locale,{title:string;local:string;optIn:string;aggregate:string;notice:string}>={
 en:{title:'Chatbot data controls',local:'Temporary data stays in memory and clears with the conversation.',optIn:'Saved preferences and consent receipts require an explicit choice.',aggregate:'Optional metrics contain counts only and suppress small cohorts.',notice:'Raw chat text is not used for persistent learning by default.'},
 fr:{title:'Contrôles des données du chatbot',local:'Les données temporaires restent en mémoire et sont effacées avec la conversation.',optIn:'Les préférences et reçus de consentement nécessitent un choix explicite.',aggregate:'Les mesures facultatives ne contiennent que des totaux et masquent les petits groupes.',notice:'Par défaut, le texte brut des conversations ne sert pas à un apprentissage persistant.'},
 es:{title:'Controles de datos del chatbot',local:'Los datos temporales permanecen en memoria y se borran al cerrar la conversación.',optIn:'Las preferencias guardadas y los recibos de consentimiento requieren una elección explícita.',aggregate:'Las métricas opcionales solo contienen recuentos y ocultan grupos pequeños.',notice:'De forma predeterminada, el texto del chat no se utiliza para aprendizaje persistente.'},
};
export function auditLocalDataManifest(items:readonly LocalDataItem[]=LOCAL_CHAT_DATA_MANIFEST,registeredScopes:readonly RetainedDataScope[]=[]):ManifestAudit{
 const missing=[...new Set(items.map(i=>i.deletionScope).filter(scope=>!registeredScopes.includes(scope)))];
 const unsafe=items.filter(i=>i.containsRawText&&i.storage!=='memory-only').map(i=>i.id);
 return{items:items.length,missingDeletionScopes:missing,unsafeRawTextItems:unsafe,ready:missing.length===0&&unsafe.length===0};
}
export function buildLocalizedPrivacySummary(locale:Locale):{title:string;sections:string[]}{const c=COPY[locale];return{title:c.title,sections:[c.local,c.optIn,c.aggregate,c.notice]};}
export function defaultOptInItems():string[]{return LOCAL_CHAT_DATA_MANIFEST.filter(i=>i.storage==='local-opt-in'&&!i.defaultEnabled).map(i=>i.id);}
export function manifestItem(id:string):LocalDataItem|undefined{const item=LOCAL_CHAT_DATA_MANIFEST.find(i=>i.id===id);return item?{...item}:undefined;}
