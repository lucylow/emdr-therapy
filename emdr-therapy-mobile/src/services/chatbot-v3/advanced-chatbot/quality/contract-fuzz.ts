import { validateStructuredResponse } from '../experience/response-blocks.ts';
import { validateHostAction } from '../actions/action-contract.ts';
import { scanSecrets } from '../privacy/secret-scanner.ts';
export type FuzzSummary={seed:number;cases:number;validatorThrows:number;unexpectedAccepts:number;findings:number};
function rng(seed:number):()=>number {let x=seed|0;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function value(random:()=>number,depth=0):unknown{const r=random();if(depth>3||r<0.18)return [null,true,false,0,-1,Number.NaN][Math.floor(random()*6)];if(r<0.35)return `fuzz-${Math.floor(random()*9999)}\n<>`;if(r<0.5)return Array.from({length:Math.floor(random()*6)},()=>value(random,depth+1));if(r<0.78)return Object.fromEntries(Array.from({length:Math.floor(random()*6)},(_,i)=>[`k${i}`,value(random,depth+1)]));return{type:'paragraph',text:'x'.repeat(Math.floor(random()*2400))};}
/** Deterministic fuzz run; checks validator robustness without sending fuzz content to a model. */
export function runContractFuzz(seed=41291,cases=500):FuzzSummary {const random=rng(seed);let validatorThrows=0,unexpectedAccepts=0,findings=0;for(let i=0;i<cases;i++){const v=value(random);try{const accepted=validateStructuredResponse(v);if(accepted&&(!v||typeof v!=='object'))unexpectedAccepts++;}catch{validatorThrows++;}const actionId=String(value(random));const params=value(random);try{const r=validateHostAction(actionId,params,{pause:true,stop:true,set_duration:true},false);if(r.ok&&r.action.requiresConfirmation)unexpectedAccepts++;}catch{validatorThrows++;}const text=String(value(random));try{findings+=scanSecrets(text).length;}catch{validatorThrows++;}}
 return{seed,cases,validatorThrows,unexpectedAccepts,findings};}
