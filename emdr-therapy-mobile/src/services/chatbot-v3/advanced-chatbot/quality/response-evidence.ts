import type { ChatResponse, Locale } from '../types.ts';
export type EvidenceLevel='strong-local-template'|'reviewed-source'|'model-reviewed-no-source'|'weak-or-ambiguous'|'safety-boundary';
export type EvidenceAssessment={level:EvidenceLevel;label:string;shouldClarify:boolean;appClaimsGrounded:boolean;sourceCount:number;reasons:string[]};
const LABELS:Record<Locale,Record<EvidenceLevel,string>>={
 en:{'strong-local-template':'Based on app guidance','reviewed-source':'Based on reviewed app information','model-reviewed-no-source':'AI-generated; no cited source','weak-or-ambiguous':'I may have misunderstood','safety-boundary':'General information only'},
 fr:{'strong-local-template':'Basé sur les informations de l’application','reviewed-source':'Basé sur une source vérifiée','model-reviewed-no-source':'Réponse IA sans source citée','weak-or-ambiguous':'J’ai peut-être mal compris','safety-boundary':'Informations générales uniquement'},
 es:{'strong-local-template':'Basado en la información de la aplicación','reviewed-source':'Basado en una fuente revisada','model-reviewed-no-source':'Respuesta de IA sin fuente citada','weak-or-ambiguous':'Puede que haya entendido mal','safety-boundary':'Solo información general'},
};
const DIRECT=new Set(['stop','pause','resume']);
/** Explain the evidence basis without treating a confidence score as a clinical probability. */
export function assessResponseEvidence(response:ChatResponse):EvidenceAssessment{
 const reasons:string[]=[];const reviewed=response.sources.filter(s=>s.trust==='local-reviewed'&&s.locale===response.locale);let level:EvidenceLevel;
 if(response.safetySignal!=='none'||response.intent==='safety_support'){level='safety-boundary';reasons.push('safety-boundary-response');}
 else if(response.mode==='local-template'&&DIRECT.has(response.intent)){level='strong-local-template';reasons.push('deterministic-control-copy');}
 else if(reviewed.length){level='reviewed-source';reasons.push('reviewed-local-source-present');}
 else if(response.mode==='remote-reviewed'){level='model-reviewed-no-source';reasons.push('remote-generated-without-citation');}
 else if(response.confidence<0.45||response.intent==='unknown'||response.intent==='clarify'){level='weak-or-ambiguous';reasons.push('low-routing-confidence-or-unknown-intent');}
 else {level='strong-local-template';reasons.push('local-deterministic-response');}
 const shouldClarify=level==='weak-or-ambiguous'&&!DIRECT.has(response.intent);
 const appClaimsGrounded=level==='strong-local-template'||level==='reviewed-source';
 return{level,label:LABELS[response.locale][level],shouldClarify,appClaimsGrounded,sourceCount:reviewed.length,reasons};
}
export function responseEvidenceCopy(locale:Locale,level:EvidenceLevel):string{return LABELS[locale][level];}
