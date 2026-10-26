export type ReadinessCheckId='repo-build'|'app-integration'|'local-stop-hook'|'provider-consent'|'privacy-storage'|'knowledge-review'|'clinical-review'|'accessibility-review'|'security-review'|'multilingual-review'|'deletion-tests'|'crisis-copy-localized';
export type ReadinessCheck={id:ReadinessCheckId;passed:boolean;details?:string;verifiedAt?:number};
export type ReadinessReport={ready:boolean;passed:number;failed:number;missing:number;checks:ReadinessCheck[];blockers:string[];note:string};
const REQUIRED:ReadinessCheckId[]=['repo-build','app-integration','local-stop-hook','provider-consent','privacy-storage','knowledge-review','clinical-review','accessibility-review','security-review','multilingual-review','deletion-tests','crisis-copy-localized'];
/** Release gate requiring real host evidence; no default success is assumed. */
export function buildReadinessReport(input:readonly ReadinessCheck[],now=Date.now()):ReadinessReport{
 const byId=new Map<ReadinessCheckId,ReadinessCheck>();for(const check of input)if(REQUIRED.includes(check.id))byId.set(check.id,check);
 const checks=REQUIRED.map(id=>{const item=byId.get(id);if(!item)return{id,passed:false,details:'not-verified'};if(item.verifiedAt===undefined||!Number.isFinite(item.verifiedAt))return{...item,passed:false,details:'verification-missing'};if(item.verifiedAt>now+60_000||now-item.verifiedAt>180*86400_000)return{...item,passed:false,details:'verification-stale'};return item;});
 const missing=checks.filter(c=>c.details==='not-verified'||c.details==='verification-missing').length;const failed=checks.filter(c=>!c.passed).length;const blockers=checks.filter(c=>!c.passed).map(c=>`${c.id}:${c.details??'failed'}`);
 return{ready:failed===0,passed:checks.length-failed,failed,missing,checks,blockers,note:'A passing code test suite does not replace a production build, accessibility audit, privacy review, or clinical-content review.'};
}
export function requiredReadinessChecks():ReadinessCheckId[]{return REQUIRED.slice();}
