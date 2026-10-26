import type { AdvancedChatbot } from '../controller.ts';
import type { Intent, RiskSignal, Locale } from '../types.ts';
export type SimulationStep={input:string;locale?:Locale;expectedIntent?:Intent;expectedSafety?:RiskSignal;expectedMode?:'local-template'|'local-retrieval'|'remote-reviewed'|'safe-fallback';mustNotCallProvider?:boolean};
export type SimulationCase={id:string;description:string;steps:SimulationStep[];localOnly?:boolean};
export type SimulationStepResult={index:number;pass:boolean;expected:string[];actual:string[];turnId:string};
export type SimulationResult={id:string;pass:boolean;steps:SimulationStepResult[];durationMs:number};
export async function simulateConversation(bot:AdvancedChatbot,test:SimulationCase,now=Date.now()):Promise<SimulationResult>{const start=Date.now();const conversationId=`simulation-${test.id}-${now}`;const steps:SimulationStepResult[]=[];
 for(let i=0;i<test.steps.length;i++){const s=test.steps[i]!;const r=await bot.respond({text:s.input,conversationId,locale:s.locale,localOnly:test.localOnly,now:now+i});const expected:string[]=[],actual:string[]=[];let pass=true;
  if(s.expectedIntent){expected.push(`intent:${s.expectedIntent}`);actual.push(`intent:${r.intent}`);pass&&=r.intent===s.expectedIntent;}
  if(s.expectedSafety){expected.push(`safety:${s.expectedSafety}`);actual.push(`safety:${r.safetySignal}`);pass&&=r.safetySignal===s.expectedSafety;}
  if(s.expectedMode){expected.push(`mode:${s.expectedMode}`);actual.push(`mode:${r.mode}`);pass&&=r.mode===s.expectedMode;}
  if(s.mustNotCallProvider){expected.push('provider:not-called');actual.push(`mode:${r.mode}`);pass&&=r.mode!=='remote-reviewed';}
  steps.push({index:i,pass,expected,actual,turnId:r.turnId});
 }
 bot.clearConversation(conversationId);return{id:test.id,pass:steps.every(s=>s.pass),steps,durationMs:Date.now()-start};
}
export async function simulateSuite(bot:AdvancedChatbot,cases:SimulationCase[],now=Date.now()):Promise<{results:SimulationResult[];passed:number;failed:number;passRate:number}>{const results:SimulationResult[]=[];for(let i=0;i<cases.length;i++)results.push(await simulateConversation(bot,cases[i]!,now+i*1000));const passed=results.filter(r=>r.pass).length;return{results,passed,failed:results.length-passed,passRate:results.length?passed/results.length:0};}
