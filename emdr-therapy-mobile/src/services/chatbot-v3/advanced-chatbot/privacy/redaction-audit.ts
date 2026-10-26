import { redactSensitiveText } from '../text.ts';
export type RedactionFinding={kind:'email'|'phone'|'id'|'url';count:number};
export type RedactionAudit={text:string;findings:RedactionFinding[];changed:boolean};
export function auditAndRedact(text:string):RedactionAudit {
  const rules:Array<[RedactionFinding['kind'],RegExp]>=[['email',/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],['phone',/\b(?:\+?\d[\d .()/-]{7,}\d)\b/g],['id',/\b(?:\d{3}[- ]?\d{2}[- ]?\d{4})\b/g],['url',/https?:\/\/\S+/gi]];
  const findings=rules.map(([kind,regex])=>({kind,count:[...text.matchAll(regex)].length})).filter(f=>f.count>0);
  const safe=redactSensitiveText(text);return {text:safe,findings,changed:safe!==text};
}
export function hasUnredactedContactData(text:string):boolean{return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)||/https?:\/\/\S+/i.test(text);}
