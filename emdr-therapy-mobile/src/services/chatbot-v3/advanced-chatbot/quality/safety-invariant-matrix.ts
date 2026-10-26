export type RequiredSafetyInvariant = 'direct-controls-local'|'medical-requests-no-provider'|'prompt-injection-no-provider'|'remote-disabled-by-default'|'no-unreviewed-citations'|'no-unconfirmed-setting-changes'|'bounded-output'|'no-sensitive-preferences'|'stream-not-partial'|'forget-clears-state';
export type InvariantCheck = { id:RequiredSafetyInvariant; passed:boolean; detail?:string };
export type InvariantReport={passed:number;failed:number;total:number;checks:InvariantCheck[];ready:boolean};
const REQUIRED:RequiredSafetyInvariant[]=['direct-controls-local','medical-requests-no-provider','prompt-injection-no-provider','remote-disabled-by-default','no-unreviewed-citations','no-unconfirmed-setting-changes','bounded-output','no-sensitive-preferences','stream-not-partial','forget-clears-state'];
/** Stable gate list for integration CI. Every required invariant must be represented explicitly. */
export function evaluateInvariantMatrix(checks:readonly InvariantCheck[]):InvariantReport{
 const byId=new Map<RequiredSafetyInvariant,InvariantCheck>();for(const item of checks)if(REQUIRED.includes(item.id))byId.set(item.id,item);
 const normalized=REQUIRED.map(id=>byId.get(id)??{id,passed:false,detail:'required-check-missing'});
 const passed=normalized.filter(x=>x.passed).length;return{passed,failed:normalized.length-passed,total:normalized.length,checks:normalized,ready:passed===normalized.length};
}
export function requiredInvariantIds():RequiredSafetyInvariant[]{return REQUIRED.slice();}
export function assertInvariantReport(report:InvariantReport):void{if(!report.ready)throw new Error(`Safety invariant gate failed: ${report.failed}/${report.total} missing or failed`);}
