import type { Locale } from '../types.ts';
export type ProcessingNotice={title:string;body:string;items:string[];requiresAction:boolean};
export function remoteProcessingNotice(locale:Locale):ProcessingNotice {
 const notices:Record<Locale,ProcessingNotice>={
  en:{title:'Optional remote AI processing',body:'If enabled, your current message may be sent to a configured AI provider. The host app must disclose provider retention and region. This chat layer does not send prior messages by default.',items:['Use only for this turn','Do not send conversation history unless separately enabled','You can choose local-only replies'],requiresAction:true},
  fr:{title:'Traitement IA distant facultatif',body:'Si cette option est activée, votre message actuel peut être envoyé à un fournisseur IA configuré. L’application doit préciser la conservation et la région du fournisseur. L’historique n’est pas envoyé par défaut.',items:['Uniquement pour ce tour','Ne pas envoyer l’historique sans activation distincte','Choisir une réponse locale uniquement'],requiresAction:true},
  es:{title:'Procesamiento remoto opcional de IA',body:'Si se activa, el mensaje actual puede enviarse a un proveedor de IA configurado. La aplicación debe explicar la retención y región del proveedor. El historial no se envía por defecto.',items:['Solo para este turno','No enviar historial sin habilitarlo por separado','Elegir respuestas solo locales'],requiresAction:true},
 };return { ...notices[locale],items:[...notices[locale].items]};
}
export function canProceedWithRemoteProcessing(notice:ProcessingNotice,userAccepted:boolean,providerReady:boolean):boolean{return notice.requiresAction&&userAccepted&&providerReady;}
