import type { UserPreferences } from '../types.ts';
export type PreferenceCandidate={field:keyof UserPreferences;value:unknown;reason:'explicit-command'|'repeated-choice'|'accessibility-setting';occurrences:number;needsConfirmation:true};
const ALLOWED=new Set<keyof UserPreferences>(['locale','tone','confirmedFeatures','reducedMotion','audioEnabled']);
/** Converts UI events into preference candidates; never learns from emotional or crisis wording. */
export class PreferenceCandidateEngine {
  private readonly counts=new Map<string,{field:keyof UserPreferences;value:unknown;count:number;reason:PreferenceCandidate['reason']}>();
  observe(field:keyof UserPreferences,value:unknown,reason:PreferenceCandidate['reason']):PreferenceCandidate|undefined {
    if(!ALLOWED.has(field)||!validValue(field,value))return undefined;
    const key=`${field}:${JSON.stringify(value)}`;const row=this.counts.get(key)??{field,value,count:0,reason};row.count++;row.reason=reason;this.counts.set(key,row);
    return {field,value,reason,occurrences:row.count,needsConfirmation:true};
  }
  review():PreferenceCandidate[]{return [...this.counts.values()].filter(row=>row.count>=2).map(row=>({field:row.field,value:row.value,reason:row.reason,occurrences:row.count,needsConfirmation:true}));}
  reset():void{this.counts.clear();}
  snapshotCounts():Record<string,number>{return Object.fromEntries([...this.counts].map(([k,v])=>[k,v.count]));}
}
function validValue(field:keyof UserPreferences,value:unknown):boolean {
  if(field==='locale')return ['en','fr','es'].includes(String(value));
  if(field==='tone')return ['warm','neutral','concise'].includes(String(value));
  if(field==='audioEnabled'||field==='reducedMotion')return typeof value==='boolean';
  if(field==='confirmedFeatures')return Array.isArray(value)&&value.length<=20&&value.every(x=>typeof x==='string'&&/^[a-z0-9_-]{1,40}$/i.test(x));
  return false;
}
