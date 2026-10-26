import { clampText, redactSensitiveText } from '../text.ts';
export type SpeechInputResult={text:string;accepted:boolean;reason:string;containsRedaction:boolean};
/** Accept text from OS speech APIs; this module does not record audio or perform transcription. */
export function normalizeSpeechTranscript(transcript:unknown,maxChars=2000):SpeechInputResult {
 if(typeof transcript!=='string')return {text:'',accepted:false,reason:'transcript-not-string',containsRedaction:false};
 const cleaned=clampText(transcript,maxChars);if(!cleaned)return {text:'',accepted:false,reason:'empty-transcript',containsRedaction:false};
 const safe=redactSensitiveText(cleaned);return {text:safe,accepted:true,reason:cleaned.length>maxChars?'truncated':'normalized',containsRedaction:safe!==cleaned};
}
export function shouldAutoSubmitSpeech(_transcript:string):false {return false;}
export function spokenOutputText(text:string,maxChars=900):string {
 return clampText(text,maxChars).replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_`#]/g,'').replace(/https?:\/\/\S+/g,'').trim();
}
