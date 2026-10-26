import type { Intent, Locale } from '../types.ts';
export type CoverageRecord={locale:Locale;intent:Intent;examples:number;positive:number;negative:number;edgeCases:number};
export function coverageMatrix(intents:readonly Intent[],locales:readonly Locale[],records:readonly CoverageRecord[]):{missing:Array<{locale:Locale;intent:Intent}>;thin:Array<{locale:Locale;intent:Intent;examples:number}>;totalExamples:number} {
 const map=new Map(records.map(r=>[`${r.locale}:${r.intent}`,r]));const missing:Array<{locale:Locale;intent:Intent}>=[];const thin:Array<{locale:Locale;intent:Intent;examples:number}>=[];
 for(const locale of locales)for(const intent of intents){const row=map.get(`${locale}:${intent}`);if(!row||row.examples===0)missing.push({locale,intent});else if(row.examples<5||row.positive===0||row.negative===0)thin.push({locale,intent,examples:row.examples});}
 return {missing,thin,totalExamples:records.reduce((sum,r)=>sum+r.examples,0)};
}
export function isCoverageReleaseReady(matrix:ReturnType<typeof coverageMatrix>):boolean{return matrix.missing.length===0&&matrix.thin.length===0;}
