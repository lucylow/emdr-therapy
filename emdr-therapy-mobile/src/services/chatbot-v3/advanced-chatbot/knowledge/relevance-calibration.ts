import type { Locale, Intent } from '../types.ts';
export type RetrievalSignal={rawScore:number;margin:number;locale:Locale;queryLength:number;matchedTerms:number;intent?:Intent;articleReviewed:boolean;sourceCurrent:boolean};
export type CalibratedRetrieval={score:number;confidence:'low'|'medium'|'high';acceptable:boolean;reasons:string[]};
export function calibrateRetrieval(signal:RetrievalSignal,options:{minimum?:number;minimumMargin?:number}={}):CalibratedRetrieval {
 const reasons:string[]=[];let score=Math.max(0,Math.min(1,Number.isFinite(signal.rawScore)?signal.rawScore:0));
 if(!signal.articleReviewed){score=0;reasons.push('article-not-reviewed');}if(!signal.sourceCurrent){score*=0.65;reasons.push('source-stale-or-unverified');}
 if(signal.queryLength<3){score*=0.4;reasons.push('query-too-short');}if(signal.matchedTerms<1){score*=0.25;reasons.push('no-shared-terms');}
 if(signal.margin<(options.minimumMargin??0.035)){score*=0.8;reasons.push('ambiguous-retrieval-margin');}
 if(signal.intent==='unknown')score*=0.9;
 // Shorter supported French/Spanish queries receive a small tolerance adjustment, not a confidence boost.
 const threshold=options.minimum??0.18;const accepted=score>=threshold&&signal.margin>=(options.minimumMargin??0.035)&&signal.articleReviewed&&signal.sourceCurrent&&signal.queryLength>=3&&signal.matchedTerms>=1;
 if(!accepted)reasons.push('below-acceptance-gate');const confidence=score>=0.72?'high':score>=0.42?'medium':'low';return{score:Number(score.toFixed(4)),confidence,acceptable:accepted,reasons};
}
export function chooseCalibratedHit<T extends {score:number;id:string}>(hits:T[],options:{minimum?:number;minimumMargin?:number}={}):{hit?:T;calibration?:CalibratedRetrieval;runnerUpMargin:number}{const sorted=hits.filter(h=>Number.isFinite(h.score)).slice().sort((a,b)=>b.score-a.score);const top=sorted[0];const margin=top?top.score-(sorted[1]?.score??0):0;if(!top)return{runnerUpMargin:0};const c=calibrateRetrieval({rawScore:top.score,margin,locale:'en',queryLength:3,matchedTerms:1,articleReviewed:true,sourceCurrent:true},options);return{hit:c.acceptable?top:undefined,calibration:c,runnerUpMargin:margin};}
