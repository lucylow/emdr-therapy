import type { ChatResponse, Locale } from '../types.ts';
import { renderReviewedCitations } from '../knowledge/citation-renderer.ts';
import { accessibleMessageModel } from './accessibility-presentation.ts';
import { structureResponse, type StructuredChatResponse } from './response-blocks.ts';
import { assessResponseEvidence, type EvidenceAssessment } from '../quality/response-evidence.ts';
import { validateHostAction, type HostCapabilities } from '../actions/action-contract.ts';
export type ChatRenderModel={turnId:string;locale:Locale;answer:string;intentLabel:string;showUncertainty:boolean;accessibility:{label:string;liveRegion:'polite'|'assertive'|'off';role:'text'|'alert'|'status'};blocks:StructuredChatResponse;citations:Array<{id:string;title:string;detail:string;label:string;locale:Locale;testId:string}>;actions:Array<{id:string;label:string;requiresConfirmation:boolean;enabled:boolean}>;warnings:string[];evidence:EvidenceAssessment};
const INTENT_LABELS:Record<Locale,Record<string,string>>={
 en:{stop:'Stop session',pause:'Pause session',resume:'Resume session',safety_support:'Support',privacy:'Privacy',unknown:'General answer',clarify:'Clarification needed',emdr_definition:'About EMDR'},
 fr:{stop:'Arrêter la séance',pause:'Mettre en pause',resume:'Reprendre',safety_support:'Soutien',privacy:'Confidentialité',unknown:'Réponse générale',clarify:'Précision nécessaire',emdr_definition:'À propos de l’EMDR'},
 es:{stop:'Detener sesión',pause:'Pausar sesión',resume:'Reanudar',safety_support:'Apoyo',privacy:'Privacidad',unknown:'Respuesta general',clarify:'Se necesita aclaración',emdr_definition:'Acerca de EMDR'}
};
/** Framework-neutral view model for React Native. It produces text/action props, never executable callbacks. */
export function createChatRenderModel(response:ChatResponse,capabilities:HostCapabilities={}):ChatRenderModel{
 const a11y=accessibleMessageModel(response);const actions=response.suggestions.filter(s=>validateHostAction(s.id,s.parameters??{},capabilities,true).ok).map(s=>({id:s.id,label:s.label.slice(0,100),requiresConfirmation:s.requiresConfirmation,enabled:true}));
 const warnings:string[]=[];const evidence=assessResponseEvidence(response);if(response.confidence<0.45)warnings.push('low-confidence');if(evidence.shouldClarify)warnings.push('clarification-recommended');if(response.mode==='remote-reviewed')warnings.push('remote-generated-content-reviewed');if(response.safetySignal!=='none')warnings.push('safety-routed');
 return{turnId:response.turnId,locale:response.locale,answer:response.text,intentLabel:INTENT_LABELS[response.locale][response.intent]??INTENT_LABELS[response.locale].unknown,showUncertainty:response.confidence<0.45,accessibility:{label:a11y.accessibilityLabel,liveRegion:a11y.liveRegion,role:a11y.role},blocks:structureResponse(response),citations:renderReviewedCitations(response.sources,response.locale),actions,warnings,evidence};
}
