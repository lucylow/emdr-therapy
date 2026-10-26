import type { TurnInput } from '../types.ts';
import { clampText } from '../text.ts';
export type NormalizedTurn={text:string;conversationId:string;now:number;locale?:TurnInput['locale'];localOnly:boolean;consent:{remoteProcessing:boolean;sendHistory:boolean;storeTranscript:boolean};inputTruncated:boolean};
export function normalizeTurn(input:TurnInput,maxInputChars:number,defaults={remoteProcessing:false,sendHistory:false,storeTranscript:false}):NormalizedTurn {
  if(!input||typeof input!=='object')throw new TypeError('Turn input is required');
  if(typeof input.conversationId!=='string'||!input.conversationId.trim())throw new TypeError('conversationId is required');
  const raw=typeof input.text==='string'?input.text:'';const text=clampText(raw,maxInputChars);
  return {text,conversationId:input.conversationId.slice(0,120),now:input.now??Date.now(),locale:input.locale,localOnly:input.localOnly===true,
    consent:{remoteProcessing:defaults.remoteProcessing&&input.consent?.remoteProcessing===true,sendHistory:defaults.sendHistory&&input.consent?.sendHistory===true,storeTranscript:defaults.storeTranscript&&input.consent?.storeTranscript===true},inputTruncated:raw.length>maxInputChars};
}
