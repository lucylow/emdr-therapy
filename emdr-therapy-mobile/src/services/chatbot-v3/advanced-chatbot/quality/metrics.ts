export type LatencySample={route:string;elapsedMs:number;success:boolean;remote:boolean};
export type LatencySummary={count:number;medianMs:number|null;p95Ms:number|null;failureRate:number|null;remoteShare:number|null};
export function summarizeLatency(samples:readonly LatencySample[]):LatencySummary {
 if(!samples.length)return {count:0,medianMs:null,p95Ms:null,failureRate:null,remoteShare:null};
 const values=samples.map(s=>Math.max(0,s.elapsedMs)).sort((a,b)=>a-b);const percentile=(p:number)=>values[Math.min(values.length-1,Math.ceil(p*values.length)-1)];
 return {count:samples.length,medianMs:percentile(0.5),p95Ms:percentile(0.95),failureRate:samples.filter(s=>!s.success).length/samples.length,remoteShare:samples.filter(s=>s.remote).length/samples.length};
}
export function validateLatencySample(value:LatencySample):boolean{return /^[a-z0-9_-]{1,40}$/i.test(value.route)&&Number.isFinite(value.elapsedMs)&&value.elapsedMs>=0&&typeof value.success==='boolean'&&typeof value.remote==='boolean';}
