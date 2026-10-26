export type MutationKind = 'case' | 'punctuation' | 'spacing' | 'quoted' | 'unicode-width' | 'leading-politeness' | 'trailing-context';
export type MutationCase = { id: string; base: string; variant: string; kind: MutationKind };
export type MutationOutcome = { id: string; kind: MutationKind; baseLabel: string; variantLabel: string; invariant: boolean };
export type MutationReport = { total: number; invariant: number; violations: MutationOutcome[]; byKind: Record<MutationKind, { total: number; invariant: number; rate: number }> };
const KINDS: MutationKind[] = ['case','punctuation','spacing','quoted','unicode-width','leading-politeness','trailing-context'];

/** Test harness for evaluating whether benign formatting changes preserve expected labels. */
export function evaluateMutations<T>(cases: readonly MutationCase[], classify: (text: string) => T, canonicalize: (label: T) => string = value => String(value)): MutationReport {
  const results: MutationOutcome[] = [];
  for (const item of cases) {
    const base = canonicalize(classify(item.base)); const variant = canonicalize(classify(item.variant));
    results.push({ id:item.id,kind:item.kind,baseLabel:base,variantLabel:variant,invariant:base===variant });
  }
  const byKind = Object.fromEntries(KINDS.map(kind => {
    const rows=results.filter(r=>r.kind===kind);const same=rows.filter(r=>r.invariant).length;
    return[kind,{total:rows.length,invariant:same,rate:rows.length?same/rows.length:1}];
  })) as MutationReport['byKind'];
  const violations=results.filter(r=>!r.invariant);
  return{total:results.length,invariant:results.length-violations.length,violations,byKind};
}
export function buildMutationCases(inputs: readonly { id:string;text:string }[]):MutationCase[] {
 const out:MutationCase[]=[];
 for(const row of inputs){
  const source=row.text;
  out.push({id:`${row.id}:case`,base:source,variant:source.toLocaleUpperCase(),kind:'case'});
  out.push({id:`${row.id}:punctuation`,base:source,variant:source.replace(/[.!?]+$/,'')+'?!',kind:'punctuation'});
  out.push({id:`${row.id}:spacing`,base:source,variant:`  ${source.split(/\s+/u).join('   ')}  `,kind:'spacing'});
  out.push({id:`${row.id}:quoted`,base:source,variant:`“${source}”`,kind:'quoted'});
  out.push({id:`${row.id}:unicode`,base:source,variant:source.replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+0xFEE0)),kind:'unicode-width'});
  out.push({id:`${row.id}:polite`,base:source,variant:`please ${source}`,kind:'leading-politeness'});
  out.push({id:`${row.id}:context`,base:source,variant:`${source} thank you`,kind:'trailing-context'});
 }
 return out;
}
export function summarizeMutationReport(report: MutationReport): { total:number; invariant:number; rate:number; worstKinds:Array<{kind:MutationKind;rate:number;total:number}> } {
 const worstKinds=KINDS.map(kind=>({kind,rate:report.byKind[kind].rate,total:report.byKind[kind].total})).filter(x=>x.total).sort((a,b)=>a.rate-b.rate||a.kind.localeCompare(b.kind));
 return{total:report.total,invariant:report.invariant,rate:report.total?report.invariant/report.total:1,worstKinds};
}
