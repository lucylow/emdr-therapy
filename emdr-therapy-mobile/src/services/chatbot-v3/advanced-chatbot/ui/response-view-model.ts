import type { ChatResponse, Locale } from '../types.ts';
import { removeUnsafeMarkdown } from '../policy/output-validator.ts';
export type ChatBubbleViewModel={accessibilityLabel:string;body:string;language:string;showSources:boolean;sourceTitles:string[];actions:Array<{id:string;label:string;requiresConfirmation:boolean}>;showSafetyNotice:boolean;modeLabel:string};
const MODE_LABELS:Record<Locale,Record<ChatResponse['mode'],string>>={
  en:{'local-template':'App response','local-retrieval':'Reviewed app information','remote-reviewed':'AI-generated response checked','safe-fallback':'Fallback response'},
  fr:{'local-template':'Réponse de l’application','local-retrieval':'Information vérifiée','remote-reviewed':'Réponse IA vérifiée','safe-fallback':'Réponse de secours'},
  es:{'local-template':'Respuesta de la aplicación','local-retrieval':'Información revisada','remote-reviewed':'Respuesta de IA revisada','safe-fallback':'Respuesta alternativa'},
};
export function toChatBubble(response:ChatResponse,locale:Locale=response.locale):ChatBubbleViewModel {
  const body=removeUnsafeMarkdown(response.text).slice(0,2000);
  return {accessibilityLabel:body,body,language:locale,showSources:response.sources.length>0,sourceTitles:response.sources.map(s=>s.title).slice(0,4),
    actions:response.suggestions.map(s=>({id:s.id,label:s.label,requiresConfirmation:s.requiresConfirmation})),showSafetyNotice:response.safetySignal!=='none',modeLabel:MODE_LABELS[locale][response.mode]};
}
