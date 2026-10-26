export type LabelledPrediction={expected:string;predicted:string;confidence?:number};
export type ClassMetric={label:string;support:number;predicted:number;truePositive:number;precision:number;recall:number;f1:number};
export type ConfusionMatrix={labels:string[];cells:Record<string,Record<string,number>>;accuracy:number;total:number;perClass:ClassMetric[];unknownPredictions:number};
export function confusionMatrix(rows:LabelledPrediction[]):ConfusionMatrix {
 const labels=[...new Set(rows.map(r=>r.expected))].sort();const cells:Record<string,Record<string,number>>={};for(const actual of labels){cells[actual]={};for(const predicted of [...labels,'__other__'])cells[actual]![predicted]=0;}
 let correct=0,unknownPredictions=0;for(const r of rows){if(!cells[r.expected])cells[r.expected]={};const pred=labels.includes(r.predicted)?r.predicted:'__other__';cells[r.expected]![pred]=(cells[r.expected]![pred]??0)+1;if(r.expected===r.predicted)correct++;if(pred==='__other__')unknownPredictions++;}
 const perClass=labels.map(label=>{const support=rows.filter(r=>r.expected===label).length;const truePositive=cells[label]?.[label]??0;const predicted=rows.filter(r=>r.predicted===label).length;const precision=predicted?truePositive/predicted:0;const recall=support?truePositive/support:0;const f1=precision+recall?2*precision*recall/(precision+recall):0;return{label,support,predicted,truePositive,precision:Number(precision.toFixed(4)),recall:Number(recall.toFixed(4)),f1:Number(f1.toFixed(4))};});
 return{labels,cells,accuracy:rows.length?correct/rows.length:0,total:rows.length,perClass,unknownPredictions};
}
export function macroF1(matrix:ConfusionMatrix):number{return matrix.perClass.length?matrix.perClass.reduce((sum,r)=>sum+r.f1,0)/matrix.perClass.length:0;}
