import type { EvaluationCase, Locale } from '../types.ts';
import { normalizeText } from '../text.ts';
export type FixtureLint={index:number;errors:string[];warnings:string[]};
export function lintEvaluationCases(cases:readonly (EvaluationCase&{locale?:Locale})[]):FixtureLint[] {
 const seen=new Map<string,number>();const results:FixtureLint[]=[];
 cases.forEach((row,index)=>{const errors:string[]=[];const warnings:string[]=[];
  if(!row.name.trim())errors.push('missing-name');if(!row.input.trim())errors.push('empty-input');if(row.input.length>2000)errors.push('input-too-long');
  if(row.locale&&!['en','fr','es'].includes(row.locale))errors.push('unsupported-locale');
  if(row.expectedIntent==='unknown'&&row.input.length<2)warnings.push('unknown-label-on-short-input');
  const key=`${row.locale??'en'}:${normalizeText(row.input)}`;if(seen.has(key))warnings.push(`duplicate-of-${seen.get(key)}`);else seen.set(key,index);
  results.push({index,errors,warnings});
 });return results.filter(r=>r.errors.length||r.warnings.length);
}
