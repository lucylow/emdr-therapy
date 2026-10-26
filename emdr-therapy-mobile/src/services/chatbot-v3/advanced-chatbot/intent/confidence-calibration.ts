import type { IntentCandidate } from '../types.ts';
export type CalibrationBand='high'|'medium'|'low';
export type CalibratedIntent={candidate:IntentCandidate;calibratedScore:number;band:CalibrationBand;needsClarification:boolean;reason:string};
export function calibrateCandidate(candidate:IntentCandidate,margin:number,localeMatch=true):CalibratedIntent {
  let score=Math.max(0,Math.min(1,candidate.score));const reasons:string[]=[];
  if(margin<0.08){score*=0.78;reasons.push('near-tie');}
  if(!localeMatch){score*=0.75;reasons.push('locale-uncertain');}
  if(candidate.evidence.length===0){score*=0.65;reasons.push('no-explanation-evidence');}
  if(candidate.intent==='unknown')score=Math.min(score,0.34);
  const band:CalibrationBand=score>=0.78?'high':score>=0.48?'medium':'low';
  return {candidate,calibratedScore:Number(score.toFixed(3)),band,needsClarification:score<0.48||reasons.includes('near-tie'),reason:reasons.join(',')||'sufficient-evidence'};
}
export function calibrationThresholds(samples:readonly {score:number;correct:boolean}[]):{count:number;accuracy:number|null;falseConfidenceRate:number|null} {
  if(!samples.length)return {count:0,accuracy:null,falseConfidenceRate:null};
  const correct=samples.filter(s=>s.correct).length;const confidentWrong=samples.filter(s=>s.score>=0.75&&!s.correct).length;
  return {count:samples.length,accuracy:correct/samples.length,falseConfidenceRate:confidentWrong/samples.length};
}
