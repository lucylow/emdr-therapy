export type ReplyStyle='concise'|'balanced'|'detailed'|'warm'|'neutral';
export type FeedbackSample={style:ReplyStyle;rating:1|2|3|4|5;createdAt:number;consented:boolean};
export type StyleRecommendation={style:ReplyStyle;confidence:number;sampleCount:number;reason:'insufficient-data'|'majority-preference'|'tie'|'stale-data'};
const STYLES:ReplyStyle[]=['concise','balanced','detailed','warm','neutral'];
/** Learns only style labels and numeric feedback, never stores the reply or prompt text. */
export class FeedbackLearner {
 private samples:FeedbackSample[]=[];
 constructor(private opts:{minSamples?:number;maxSamples?:number;ttlMs?:number}={}){}
 add(sample:FeedbackSample):boolean {if(!sample.consented||!STYLES.includes(sample.style)||!Number.isInteger(sample.rating)||sample.rating<1||sample.rating>5||!Number.isFinite(sample.createdAt))return false;this.samples.push({...sample});const cap=this.opts.maxSamples??200;if(this.samples.length>cap)this.samples=this.samples.slice(-cap);return true;}
 recommend(now=Date.now()):StyleRecommendation {this.prune(now);const threshold=this.opts.minSamples??5;if(this.samples.length<threshold)return{style:'balanced',confidence:0,sampleCount:this.samples.length,reason:'insufficient-data'};
  const scores=new Map<ReplyStyle,{sum:number;count:number}>();for(const s of this.samples){const row=scores.get(s.style)??{sum:0,count:0};row.sum+=s.rating;row.count++;scores.set(s.style,row);}const ranked=[...scores.entries()].map(([style,v])=>({style,mean:v.sum/v.count,count:v.count})).sort((a,b)=>b.mean-a.mean||b.count-a.count);
  if(!ranked.length)return{style:'balanced',confidence:0,sampleCount:0,reason:'insufficient-data'};if(ranked[1]&&Math.abs(ranked[0].mean-ranked[1].mean)<0.15)return{style:'balanced',confidence:0.2,sampleCount:this.samples.length,reason:'tie'};return{style:ranked[0].style,confidence:Math.min(0.9,ranked[0].count/this.samples.length*ranked[0].mean/5),sampleCount:this.samples.length,reason:'majority-preference'}; }
 forget():void{this.samples=[];} prune(now=Date.now()):number{const before=this.samples.length;this.samples=this.samples.filter(s=>now-s.createdAt<=(this.opts.ttlMs??180*86_400_000));return before-this.samples.length;} size():number{return this.samples.length;}
}
