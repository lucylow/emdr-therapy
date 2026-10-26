import type { ChatResponse } from '../types.ts';
export type SafetyInvariant='risk-must-be-local'|'control-must-be-local'|'safety-no-resume-actions'|'safety-no-start-actions'|'confidence-bounded'|'turn-id-present'|'remote-needs-consent'|'sources-must-be-reviewed'|'action-list-bounded';
export type SafetyAudit={pass:boolean;violations:SafetyInvariant[]};
export type SafetyAuditContext={remoteConsent?:boolean;isDirectControl?:boolean};
export function auditResponseSafety(response:ChatResponse,context:SafetyAuditContext={}):SafetyAudit {
 const v:SafetyInvariant[]=[];
 if(response.safetySignal!=='none'&&response.mode==='remote-reviewed')v.push('risk-must-be-local');
 if(context.isDirectControl&&response.mode==='remote-reviewed')v.push('control-must-be-local');
 if(response.safetySignal!=='none'&&response.suggestions.some(s=>['resume','start_grounding','start_breathing','session_setup'].includes(s.id)))v.push('safety-no-start-actions');
 if(response.safetySignal!=='none'&&response.suggestions.some(s=>s.id==='resume'))v.push('safety-no-resume-actions');
 if(!Number.isFinite(response.confidence)||response.confidence<0||response.confidence>1)v.push('confidence-bounded');
 if(!response.turnId||response.turnId.length>100)v.push('turn-id-present');
 if(response.mode==='remote-reviewed'&&!context.remoteConsent)v.push('remote-needs-consent');
 if(response.sources.some(s=>s.trust!=='local-reviewed'))v.push('sources-must-be-reviewed');
 if(response.suggestions.length>4)v.push('action-list-bounded');
 return{pass:v.length===0,violations:[...new Set(v)]};
}
export function safetyAuditSummary(audits:SafetyAudit[]):{total:number;passed:number;failed:number;violations:Record<string,number>}{const counts:Record<string,number>={};let passed=0;for(const a of audits){if(a.pass)passed++;for(const v of a.violations)counts[v]=(counts[v]??0)+1;}return{total:audits.length,passed,failed:audits.length-passed,violations:counts};}
