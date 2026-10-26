import { reviewGeneratedText } from '../policy/output-validator.ts';
import { hasPromptInjectionSignals } from '../text.ts';
import { containsMedicalDiagnosisRequest, detectSafetySignal } from '../policy/safety.ts';
import type { Locale } from '../types.ts';
export type PolicyFixture={id:string;text:string;locale:Locale;expectInjection?:boolean;expectDiagnosis?:boolean;expectSafety?:boolean;unsafeOutput?:string};
export type PolicyFinding={id:string;passed:boolean;checks:string[]};
export function runPolicySuite(fixtures:readonly PolicyFixture[]):{total:number;passed:number;findings:PolicyFinding[]} {
 const findings=fixtures.map(f=>{const checks:string[]=[];let passed=true;
  if(f.expectInjection!==undefined){const actual=hasPromptInjectionSignals(f.text);checks.push(`injection:${actual}`);passed&&=actual===f.expectInjection;}
  if(f.expectDiagnosis!==undefined){const actual=containsMedicalDiagnosisRequest(f.text);checks.push(`diagnosis:${actual}`);passed&&=actual===f.expectDiagnosis;}
  if(f.expectSafety!==undefined){const actual=detectSafetySignal(f.text,f.locale)!=='none';checks.push(`safety:${actual}`);passed&&=actual===f.expectSafety;}
  if(f.unsafeOutput){const actual=reviewGeneratedText(f.unsafeOutput);checks.push(`unsafe-output-rejected:${!actual.accepted}`);passed&&=!actual.accepted;}
  return {id:f.id,passed,checks};});return {total:findings.length,passed:findings.filter(f=>f.passed).length,findings};
}
