import type { ChatResponse, Locale } from '../types.ts';
import { safeFallback, reviewGeneratedText } from '../policy/output-validator.ts';
export type RepairResult={response:ChatResponse;changed:boolean;reasons:string[]};
export function repairResponse(response:ChatResponse,locale:Locale,maxChars=1800):RepairResult {
  const reasons:string[]=[];let text=response.text;
  const reviewed=reviewGeneratedText(text,maxChars);
  if(!reviewed.accepted){text=safeFallback(locale);reasons.push(...reviewed.reasons,'fallback-substituted');}
  else if(reviewed.text!==text){text=reviewed.text;reasons.push('length-or-markup-normalized');}
  const output={...response,text,locale,explanation:[...response.explanation,...reasons].slice(0,12)};
  return {response:output,changed:text!==response.text,reasons};
}
export function responseSentenceCount(text:string):number{return (text.match(/[.!?]+(?=\s|$)/gu)??[]).length+(text.trim()&&!/[.!?]$/u.test(text.trim())?1:0);}
