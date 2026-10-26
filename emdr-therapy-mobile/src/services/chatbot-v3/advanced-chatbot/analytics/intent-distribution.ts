import type { Intent, Locale } from '../types.ts';
export type IntentObservation={intent:Intent;locale:Locale;at:number;confidence:number;source:'local'|'remote-reviewed'|'fallback'};
export type DriftResult={enoughData:boolean;sampleSize:number;baselineSize:number;current:Record<string,number>;baseline:Record<string,number>;changedLabels:string[];maxDelta:number;reason:'insufficient-data'|'stable'|'distribution-shift'};
/** Maintains aggregate intent counts only; it never accepts utterance text or identifiers. */
export class IntentDistributionMonitor {
 private observations:IntentObservation[]=[];
 private baseline?:{distribution:Record<string,number>;size:number};
 constructor(private opts:{maxObservations?:number;minCohort?:number;windowMs?:number;deltaThreshold?:number}={}){}
 record(value:IntentObservation,now=Date.now()):boolean{
  if(!value||typeof value.intent!=='string'||!Number.isFinite(value.at)||!Number.isFinite(value.confidence)||value.confidence<0||value.confidence>1||!['en','fr','es'].includes(value.locale)||!['local','remote-reviewed','fallback'].includes(value.source))return false;
  if(value.at>now+60_000||value.at<now-(this.opts.windowMs??30*86400_000)*4)return false;
  this.prune(now);this.observations.push({intent:value.intent,locale:value.locale,at:Math.floor(value.at),confidence:value.confidence,source:value.source});while(this.observations.length>clamp(this.opts.maxObservations??5000,100,50000))this.observations.shift();return true;
 }
 snapshot(options:{since?:number;locale?:Locale;now?:number}={}):Record<string,number>{this.prune(options.now??Date.now());return makeDistribution(this.observations.filter(o=>(options.since===undefined||o.at>=options.since)&&(!options.locale||o.locale===options.locale)));}
 establishBaseline(options:{since?:number;locale?:Locale;now?:number}={}):Record<string,number>{const now=options.now??Date.now();this.prune(now);const rows=this.observations.filter(o=>(options.since===undefined||o.at>=options.since)&&(!options.locale||o.locale===options.locale));const distribution=makeDistribution(rows);this.baseline={distribution,size:rows.length};return{...distribution};}
 compare(options:{since?:number;locale?:Locale;now?:number}={}):DriftResult{
 const rows=this.observations.filter(o=>(options.since===undefined||o.at>=options.since)&&(!options.locale||o.locale===options.locale));const current=makeDistribution(rows);const baseline=this.baseline?.distribution??{};const baselineSize=this.baseline?.size??0;const min=clamp(this.opts.minCohort??30,5,10000);
 if(rows.length<min||baselineSize<min)return{enoughData:false,sampleSize:rows.length,baselineSize,current,baseline:{...baseline},changedLabels:[],maxDelta:0,reason:'insufficient-data'};
 const keys=new Set([...Object.keys(current),...Object.keys(baseline)]);let maxDelta=0;const changedLabels:string[]=[];for(const key of keys){const d=Math.abs((current[key]??0)-(baseline[key]??0));maxDelta=Math.max(maxDelta,d);if(d>=clamp(this.opts.deltaThreshold??0.2,0.05,1))changedLabels.push(key);}
 return{enoughData:true,sampleSize:rows.length,baselineSize,current,baseline:{...baseline},changedLabels,maxDelta,reason:changedLabels.length?'distribution-shift':'stable'};
 }
 clear():void{this.observations=[];this.baseline=undefined;}
 private prune(now:number):void{const ttl=clamp(this.opts.windowMs??30*86400_000,60_000,365*86400_000);this.observations=this.observations.filter(o=>o.at>=now-ttl);}
}
function makeDistribution(rows:IntentObservation[]):Record<string,number>{const counts:Record<string,number>={};for(const r of rows)counts[r.intent]=(counts[r.intent]??0)+1;const n=rows.length||1;for(const k of Object.keys(counts))counts[k]=Number((counts[k]!/n).toFixed(4));return counts;}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
