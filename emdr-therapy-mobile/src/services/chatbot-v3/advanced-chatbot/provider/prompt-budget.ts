import type { ChatMessage, ModelRequest } from '../types.ts';
import { redactSensitiveText, truncateAtBoundary } from '../text.ts';
export type BudgetedContext={messages:Array<{role:'user'|'assistant';content:string}>;usedChars:number;droppedMessages:number;truncatedMessages:number};
export function fitContextBudget(messages:readonly ChatMessage[],maxMessages=8,maxChars=4000):BudgetedContext {
  const selected=messages.filter(m=>m.role!=='system').slice(-Math.max(0,maxMessages));let usedChars=0;let truncatedMessages=0;const output:Array<{role:'user'|'assistant';content:string}>=[];
  for(const msg of selected){if(usedChars>=maxChars)break;const clean=redactSensitiveText(msg.text);const remaining=maxChars-usedChars;let content=clean;
    if(content.length>remaining){content=truncateAtBoundary(content,remaining);truncatedMessages++;}
    if(!content)continue;output.push({role:msg.role as 'user'|'assistant',content});usedChars+=content.length;
  }
  return {messages:output,usedChars,droppedMessages:Math.max(0,messages.length-output.length),truncatedMessages};
}
export function withBudgetedContext(request:ModelRequest,messages:readonly ChatMessage[],maxMessages=8,maxChars=4000):{request:ModelRequest;budget:BudgetedContext} {
  const budget=fitContextBudget(messages,maxMessages,maxChars);return {request:{...request,context:budget.messages},budget};
}
