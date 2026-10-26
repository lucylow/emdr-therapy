import type { EvaluationCase, Intent, Locale } from '../types.ts';
import { classifyPrimaryIntent } from '../intent-engine.ts';
export type PerturbationResult={original:string;perturbed:string;expected:Intent;actual:Intent;invariant:boolean;kind:string};
export function perturbText(input:string):Array<{text:string;kind:string}> {
 const outputs=[{text:input.toUpperCase(),kind:'uppercase'},{text:`  ${input}  `,kind:'whitespace'},{text:input.replace(/\s+/g,'   '),kind:'spacing'},{text:input.replace(/[.!?]/g,''),kind:'punctuation'},{text:input.split(' ').reverse().join(' '),kind:'reordered-words'}];
 return outputs.filter(x=>x.text!==input).map(x=>({...x}));
}
export function evaluateRobustness(cases:readonly (EvaluationCase&{locale?:Locale})[]):{total:number;invariant:number;invarianceRate:number|null;results:PerturbationResult[]} {
 const results:PerturbationResult[]=[];
 for(const item of cases){if(!item.expectedIntent)continue;const locale=item.locale??'en';for(const p of perturbText(item.input)){const actual=classifyPrimaryIntent(p.text,locale).intent;results.push({original:item.input,perturbed:p.text,expected:item.expectedIntent,actual,invariant:actual===item.expectedIntent,kind:p.kind});}}
 return {total:results.length,invariant:results.filter(r=>r.invariant).length,invarianceRate:results.length?results.filter(r=>r.invariant).length/results.length:null,results};
}
