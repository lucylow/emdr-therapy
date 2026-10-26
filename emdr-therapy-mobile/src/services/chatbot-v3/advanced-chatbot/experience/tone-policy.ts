import type { Locale } from '../types.ts';
export type ReplyTone = 'neutral' | 'warm' | 'concise' | 'grounded';
export type ToneDecision = { tone: ReplyTone; reason: 'explicit-setting'|'safety-support'|'short-command'|'complex-question'|'default'; mayMirrorEmotion: false };
/** Chooses presentation style without making a psychological inference about the user. */
export function chooseReplyTone(input:{locale:Locale;text:string;explicitTone?:ReplyTone;safetySignal?:boolean;maxWords?:number}):ToneDecision {
 if(input.safetySignal)return{tone:'grounded',reason:'safety-support',mayMirrorEmotion:false};
 if(input.explicitTone)return{tone:input.explicitTone,reason:'explicit-setting',mayMirrorEmotion:false};
 const text=input.text.normalize('NFKC').trim();const words=text?text.split(/\s+/u).length:0;
 if(words<=3||input.maxWords!==undefined&&input.maxWords<=35)return{tone:'concise',reason:'short-command',mayMirrorEmotion:false};
 if(words>=35||/[?？]/u.test(text)&&words>=12)return{tone:'warm',reason:'complex-question',mayMirrorEmotion:false};
 return{tone:'neutral',reason:'default',mayMirrorEmotion:false};
}
export function constrainTone(tone:ReplyTone,locale:Locale, text:string):{tone:ReplyTone;text:string;changes:string[]} {
 const changes:string[]=[];let safeText=text.replace(/\s+/g,' ').trim();
 if(safeText.length>1800){safeText=safeText.slice(0,1797).replace(/\s+\S*$/u,'')+'…';changes.push('bounded-length');}
 // Do not use excessively intimate or emotionally mirroring phrases as default personalization.
 const intimate:Record<Locale,RegExp>={en:/\b(i love you|i know exactly how you feel|i am your therapist)\b/gi,fr:/\b(je t'aime|je sais exactement ce que tu ressens|je suis ton thérapeute)\b/gi,es:/\b(te amo|sé exactamente cómo te sientes|soy tu terapeuta)\b/gi};
 const before=safeText;const replacement:Record<Locale,string>={en:'I can offer general information',fr:'Je peux fournir des informations générales',es:'Puedo ofrecer información general'};safeText=safeText.replace(intimate[locale],replacement[locale]);
 if(before!==safeText)changes.push('removed-inappropriate-intimacy');
 return{tone,text:safeText,changes};
}
