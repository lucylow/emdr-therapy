import type { EvaluationCase, Intent, Locale } from '../types.ts';
import { classifyPrimaryIntent } from '../intent-engine.ts';
import { detectSafetySignal } from '../policy/safety.ts';
export type BenchmarkResult={total:number;intentCorrect:number;intentAccuracy:number|null;confusion:Record<string,Record<string,number>>;perLocale:Record<Locale,{total:number;correct:number;accuracy:number|null}>;missedSafety:number;unexpectedSafety:number};
export function runBenchmark(cases:readonly (EvaluationCase&{locale?:Locale})[]):BenchmarkResult {
 let intentCorrect=0,missedSafety=0,unexpectedSafety=0;const confusion:Record<string,Record<string,number>>={};const perLocale:Record<Locale,{total:number;correct:number;accuracy:number|null}>={en:{total:0,correct:0,accuracy:null},fr:{total:0,correct:0,accuracy:null},es:{total:0,correct:0,accuracy:null}};
 for(const c of cases){const locale=c.locale??'en';const got=classifyPrimaryIntent(c.input,locale).intent;const safety=detectSafetySignal(c.input,locale);
  if(c.expectedIntent){confusion[c.expectedIntent]??={};confusion[c.expectedIntent][got]=(confusion[c.expectedIntent][got]??0)+1;if(got===c.expectedIntent)intentCorrect++;perLocale[locale].total++;if(got===c.expectedIntent)perLocale[locale].correct++;}
  if(c.expectedSafety&&c.expectedSafety!=='none'&&safety==='none')missedSafety++;if((!c.expectedSafety||c.expectedSafety==='none')&&safety!=='none')unexpectedSafety++;
 }
 for(const locale of ['en','fr','es'] as const){const row=perLocale[locale];row.accuracy=row.total?row.correct/row.total:null;}
 const total=cases.filter(c=>c.expectedIntent!==undefined).length;
 return {total,intentCorrect,intentAccuracy:total?intentCorrect/total:null,confusion,perLocale,missedSafety,unexpectedSafety};
}
export function benchmarkCase(name:string,input:string,expectedIntent?:Intent,expectedSafety?:EvaluationCase['expectedSafety'],locale:Locale='en'):EvaluationCase&{locale:Locale}{return {name,input,expectedIntent,expectedSafety,locale};}
