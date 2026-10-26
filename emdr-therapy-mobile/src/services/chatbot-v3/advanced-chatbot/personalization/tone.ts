import type { Locale, UserPreferences } from '../types.ts';
export type ToneRules={intro?:string;maxSentences:number;maxChars:number;useEmoji:boolean;preferBullets:boolean};
export function toneRules(preferences:UserPreferences|undefined,locale:Locale):ToneRules {
  const tone=preferences?.tone??'warm';
  const defaults:Record<Locale,ToneRules>={
    en:{intro:'',maxSentences:5,maxChars:1100,useEmoji:false,preferBullets:false},
    fr:{intro:'',maxSentences:5,maxChars:1100,useEmoji:false,preferBullets:false},
    es:{intro:'',maxSentences:5,maxChars:1100,useEmoji:false,preferBullets:false},
  };
  const base={...defaults[locale]};
  if(tone==='concise'){base.maxSentences=3;base.maxChars=550;}
  if(tone==='neutral'){base.maxSentences=4;base.maxChars=850;}
  return base;
}
export function applyTone(text:string,preferences:UserPreferences|undefined,locale:Locale):string {
  const rules=toneRules(preferences,locale);
  const normalized=text.replace(/\s+/g,' ').trim();
  const sentences=normalized.match(/[^.!?]+[.!?]?/gu)??[normalized];
  return sentences.slice(0,rules.maxSentences).join('').trim().slice(0,rules.maxChars);
}
