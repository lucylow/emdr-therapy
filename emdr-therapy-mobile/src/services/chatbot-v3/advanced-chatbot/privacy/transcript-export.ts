import type { ChatMessage } from '../types.ts';
import { redactSensitiveText, clampText } from '../text.ts';
export type TranscriptExport={schemaVersion:1;createdAt:string;messages:Array<{role:'user'|'assistant';text:string;timestamp?:string}>;redactedCount:number;notice:string};
export function exportTranscript(messages:readonly ChatMessage[],consent:boolean,now=Date.now()):TranscriptExport|undefined {
 if(!consent)return undefined;
 const filtered=messages.filter(m=>m.role==='user'||m.role==='assistant').slice(-200);let redactedCount=0;
 const output=filtered.map(m=>{const clean=redactSensitiveText(clampText(m.text,4000));if(clean!==m.text)redactedCount++;return {role:m.role as 'user'|'assistant',text:clean,timestamp:typeof m.createdAt==='number'?new Date(m.createdAt).toISOString():undefined};});
 return {schemaVersion:1,createdAt:new Date(now).toISOString(),messages:output,redactedCount,notice:'Export contains conversational content. Keep it private and delete it when no longer needed.'};
}
export function validateTranscriptExport(value:unknown):value is TranscriptExport {
 if(!value||typeof value!=='object')return false;const r=value as Record<string,unknown>;
 return r.schemaVersion===1&&typeof r.createdAt==='string'&&Array.isArray(r.messages)&&r.messages.length<=200&&typeof r.redactedCount==='number'&&typeof r.notice==='string'&&r.messages.every(m=>!!m&&typeof m==='object'&&['user','assistant'].includes(String((m as {role?:unknown}).role))&&typeof (m as {text?:unknown}).text==='string');
}
export function scrubTranscriptExport(transcript:TranscriptExport):TranscriptExport {return {...transcript,messages:transcript.messages.map(m=>({...m,text:redactSensitiveText(m.text)}))};}
