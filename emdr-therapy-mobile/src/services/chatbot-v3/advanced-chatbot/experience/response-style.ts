import type { UserPreferences } from '../types.ts';
export type ResponseStyle={maxSentences:number;maxCharacters:number;format:'paragraph'|'bullets';addressUser:boolean;emoji:boolean;};
export function responseStyle(preferences:UserPreferences={}):ResponseStyle {
 switch(preferences.tone){case 'concise':return {maxSentences:2,maxCharacters:420,format:'paragraph',addressUser:false,emoji:false};case 'neutral':return {maxSentences:4,maxCharacters:850,format:'paragraph',addressUser:false,emoji:false};default:return {maxSentences:5,maxCharacters:1100,format:'paragraph',addressUser:false,emoji:false};}
}
export function applyResponseStyle(text:string,preferences:UserPreferences={}):string {
 const style=responseStyle(preferences);const clean=text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();const parts=clean.match(/[^.!?]+[.!?]?/gu)??[];
 return parts.slice(0,style.maxSentences).join('').trim().slice(0,style.maxCharacters);
}
