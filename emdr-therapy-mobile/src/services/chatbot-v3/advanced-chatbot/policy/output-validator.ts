import type { ActionSuggestion, ChatResponse, Locale, RiskSignal, Source } from '../types.ts';
import { clampText, normalizeText, truncateAtBoundary } from '../text.ts';

const NON_DIAGNOSTIC = [
  /\byou (definitely )?have (ptsd|depression|anxiety|bipolar disorder)\b/iu,
  /\bi diagnose you with\b/iu,
  /\bthis proves you have\b/iu,
];
const UNSUPPORTED_CLAIMS = [
  /\bguaranteed to heal trauma\b/iu,
  /\bthis will cure you\b/iu,
  /\byou are completely safe\b/iu,
];
export type OutputReview = { accepted:boolean; text:string; reasons:string[] };
export function reviewGeneratedText(text:string, maxChars=1800):OutputReview {
  const reasons:string[]=[];
  const clean=clampText(text, maxChars*3);
  if (!clean) return {accepted:false,text:'',reasons:['empty-output']};
  if (NON_DIAGNOSTIC.some(p=>p.test(clean))) reasons.push('diagnostic-claim');
  if (UNSUPPORTED_CLAIMS.some(p=>p.test(clean))) reasons.push('unsupported-clinical-claim');
  if (/\b(ignore all previous instructions|reveal the system prompt|api key is)\b/iu.test(clean)) reasons.push('injection-or-secret-text');
  const safe=truncateAtBoundary(clean.replace(/<\/?(?:script|iframe|object)[^>]*>/giu,''),maxChars);
  if (safe.length < clean.length) reasons.push('truncated');
  return {accepted:!reasons.some(r=>r==='diagnostic-claim'||r==='unsupported-clinical-claim'||r==='injection-or-secret-text'),text:safe,reasons};
}
export function validateResponseShape(value:unknown):value is ChatResponse {
  if (!value || typeof value!=='object') return false;
  const r=value as Record<string,unknown>;
  return typeof r.text==='string' && typeof r.locale==='string' && ['en','fr','es'].includes(r.locale)
    && typeof r.intent==='string' && typeof r.confidence==='number' && r.confidence>=0 && r.confidence<=1
    && Array.isArray(r.sources) && Array.isArray(r.suggestions) && Array.isArray(r.explanation)
    && ['none','urgent_support_request','self_harm_language','immediate_danger_language'].includes(String(r.safetySignal))
    && ['local-template','local-retrieval','remote-reviewed','safe-fallback'].includes(String(r.mode)) && typeof r.turnId==='string';
}
export function safeResponse(params:{text:string;locale:Locale;intent:ChatResponse['intent'];confidence?:number;sources?:Source[];suggestions?:ActionSuggestion[];safetySignal?:RiskSignal;turnId:string;mode?:ChatResponse['mode'];explanation?:string[]}):ChatResponse {
  const reviewed=reviewGeneratedText(params.text);
  return {
    text:reviewed.accepted ? reviewed.text : safeFallback(params.locale),
    locale:params.locale,intent:params.intent,confidence:params.confidence ?? 0,
    sources:params.sources ?? [],suggestions:params.suggestions ?? [],safetySignal:params.safetySignal ?? 'none',
    mode:reviewed.accepted ? (params.mode ?? 'local-template') : 'safe-fallback',
    explanation:[...(params.explanation ?? []),...reviewed.reasons].slice(0,12),turnId:params.turnId,
  };
}
export function safeFallback(locale:Locale):string {
  const templates:Record<Locale,string>={
    en:'I’m not fully sure I understood. I can explain app features, privacy settings, or optional grounding and breathing tools. What would be most useful?',
    fr:'Je ne suis pas certain d’avoir compris. Je peux expliquer les fonctions de l’application, la confidentialité ou proposer des outils facultatifs d’ancrage et de respiration. Qu’est-ce qui serait utile?',
    es:'No estoy seguro de haber entendido. Puedo explicar las funciones de la aplicación, la privacidad u ofrecer herramientas opcionales de conexión con el presente y respiración. ¿Qué sería más útil?',
  }; return templates[locale] ?? templates.en;
}
export function removeUnsafeMarkdown(text:string):string {
  return text.replace(/```[\s\S]*?```/g,'[code omitted]').replace(/!\[[^\]]*\]\([^)]*\)/g,'')
    .replace(/<[^>]{1,200}>/g,'').replace(/\[([\s\S]{1,120})\]\((javascript:|data:)[^)]+\)/gi,'$1');
}
export function outputContainsActionInvocation(text:string):boolean {
  const normalized=normalizeText(text);
  return /\b(execute tool|call function|run command|invoke capability|action id)\b/u.test(normalized);
}
