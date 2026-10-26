export type MetricName='turn'|'local-answer'|'remote-answer'|'fallback'|'clarification'|'user-correction'|'feedback-positive'|'feedback-negative'|'provider-error';
export type AggregateRow={period:string;metric:MetricName;count:number};
/** Counts only event names and time buckets: no transcript, user ID, prompt, or arbitrary payload. */
export class PrivacyMetrics {
 private counts=new Map<string,number>();
 constructor(private opts:{minCohort?:number;maxBuckets?:number}={}){}
 increment(metric:MetricName,period:string,count=1):void{if(!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(period))throw new Error('Period must be YYYY-MM');if(!Number.isInteger(count)||count<0||count>1000)throw new Error('Count must be a bounded non-negative integer');const key=`${period}:${metric}`;this.counts.set(key,Math.min(1_000_000,(this.counts.get(key)??0)+count));this.enforceCapacity();}
 report():AggregateRow[]{const min=this.opts.minCohort??5;return [...this.counts.entries()].map(([key,count])=>{const [period,metric]=key.split(':') as [string,MetricName];return{period,metric,count};}).filter(row=>row.count>=min).sort((a,b)=>a.period.localeCompare(b.period)||a.metric.localeCompare(b.metric));}
 clear():void{this.counts.clear();}
 bucketCount():number{return this.counts.size;}
 private enforceCapacity():void{const cap=this.opts.maxBuckets??120;while(this.counts.size>cap){const first=this.counts.keys().next().value as string|undefined;if(!first)break;this.counts.delete(first);}}
}
export function qualityRate(numerator:number,denominator:number,minSample=5):{available:boolean;rate?:number;sampleSize:number}{if(!Number.isFinite(numerator)||!Number.isFinite(denominator)||numerator<0||denominator<0||numerator>denominator)throw new Error('Invalid metric counts');if(denominator<minSample)return{available:false,sampleSize:denominator};return{available:true,rate:denominator?numerator/denominator:0,sampleSize:denominator};}
