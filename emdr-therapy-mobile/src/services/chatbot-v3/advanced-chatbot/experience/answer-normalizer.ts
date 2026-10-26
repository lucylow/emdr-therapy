import { normalizeText } from '../text.ts';
export type NormalizedAnswer={text:string;changed:boolean;removedLines:number;removedSentences:number;truncated:boolean};
export function normalizeGeneratedAnswer(raw:string,options:{maxChars?:number;maxLines?:number;maxSentences?:number}={}):NormalizedAnswer {
 const maxChars=Math.max(60,Math.min(4000,options.maxChars??1800)),maxLines=Math.max(1,Math.min(40,options.maxLines??14)),maxSentences=Math.max(1,Math.min(20,options.maxSentences??8));
 const original=raw;let text=raw.replace(/\u0000/g,'').replace(/\r\n/g,'\n').replace(/[\t ]+/g,' ');let removedLines=0,removedSentences=0;
 const lines=text.split('\n').map(s=>s.trim()).filter(Boolean);const uniqueLines:string[]=[];const seen=new Set<string>();for(const line of lines){const key=normalizeText(line);if(key&&seen.has(key)){removedLines++;continue;}seen.add(key);uniqueLines.push(line);}
 text=uniqueLines.slice(0,maxLines).join('\n');if(uniqueLines.length>maxLines)removedLines+=uniqueLines.length-maxLines;
 const segments=text.split(/(?<=[.!?])\s+/).filter(Boolean);const uniqueSentences:string[]=[];const sentenceSeen=new Set<string>();for(const sentence of segments){const key=normalizeText(sentence);if(key&&sentenceSeen.has(key)){removedSentences++;continue;}sentenceSeen.add(key);uniqueSentences.push(sentence.trim());}
 if(uniqueSentences.length>maxSentences)removedSentences+=uniqueSentences.length-maxSentences;text=uniqueSentences.slice(0,maxSentences).join(' ');
 let truncated=false;if(text.length>maxChars){let cut=text.slice(0,maxChars);const boundary=cut.lastIndexOf(' ');text=cut.slice(0,boundary>maxChars*.7?boundary:maxChars).trimEnd();truncated=true;}
 text=text.replace(/\s+([,.!?;:])/g,'$1').replace(/([.!?]){2,}/g,'$1').trim();return{text,changed:text!==original,removedLines,removedSentences,truncated};
}
export function compareNormalizedAnswer(a:string,b:string):{equal:boolean;left:string;right:string}{const left=normalizeText(a).replace(/\s+/g,' ').trim(),right=normalizeText(b).replace(/\s+/g,' ').trim();return{equal:left===right,left,right};}
