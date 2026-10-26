import type { Locale, UserPreferences } from '../types.ts';
export type PreferenceMergeValue = { key:'locale'|'tone'|'reducedMotion'|'audioEnabled'|'confirmedFeatures';value:unknown;source:'explicit'|'accepted-inference';updatedAt:number;consent:boolean };
export type PreferenceMergeResult={preferences:UserPreferences;explanations:Record<string,'explicit-wins'|'accepted-inference-used'|'unconsented-ignored'|'invalid-ignored'|'older-explicit-retained'>};
const KEYS=['locale','tone','reducedMotion','audioEnabled','confirmedFeatures'] as const;
/** Merges whitelisted presentation preferences only; explicit choices always outrank accepted inferences. */
export function mergeSafePreferences(base:readonly PreferenceMergeValue[],incoming:readonly PreferenceMergeValue[],now=Date.now()):PreferenceMergeResult{
 const chosen=new Map<string,PreferenceMergeValue>();const explanations:Record<string,PreferenceMergeResult['explanations'][string]>={};
 for(const row of [...base,...incoming]){
  if(!KEYS.includes(row.key)||!['explicit','accepted-inference'].includes(row.source)||!validValue(row.key,row.value)||!Number.isFinite(row.updatedAt)||row.updatedAt>now+60_000||row.updatedAt<0){explanations[String(row.key)]='invalid-ignored';continue;}
  if(!row.consent){explanations[row.key]='unconsented-ignored';continue;}
  if(row.source==='accepted-inference'&&!row.consent){explanations[row.key]='unconsented-ignored';continue;}
  const old=chosen.get(row.key);
  if(!old){chosen.set(row.key,row);continue;}
  if(old.source==='explicit'&&row.source!=='explicit'){explanations[row.key]='explicit-wins';continue;}
  if(row.source==='explicit'&&old.source!=='explicit'){chosen.set(row.key,row);explanations[row.key]='explicit-wins';continue;}
  if(row.updatedAt>=old.updatedAt)chosen.set(row.key,row);else if(old.source==='explicit')explanations[row.key]='older-explicit-retained';
 }
 const prefs:UserPreferences={};for(const [key,row]of chosen){if(key==='locale')prefs.locale=row.value as Locale;else if(key==='tone')prefs.tone=row.value as 'warm'|'neutral'|'concise';else if(key==='reducedMotion')prefs.reducedMotion=row.value as boolean;else if(key==='audioEnabled')prefs.audioEnabled=row.value as boolean;else if(key==='confirmedFeatures')prefs.confirmedFeatures=[...(row.value as string[])];if(!explanations[key])explanations[key]=row.source==='explicit'?'explicit-wins':'accepted-inference-used';}
 return{preferences:prefs,explanations};
}
function validValue(key:PreferenceMergeValue['key'],value:unknown):boolean{if(key==='locale')return value==='en'||value==='fr'||value==='es';if(key==='tone')return value==='warm'||value==='neutral'||value==='concise';if(key==='reducedMotion'||key==='audioEnabled')return typeof value==='boolean';return Array.isArray(value)&&value.length<=30&&value.every(v=>typeof v==='string'&&/^[a-z0-9][a-z0-9_-]{0,48}$/i.test(v));}
