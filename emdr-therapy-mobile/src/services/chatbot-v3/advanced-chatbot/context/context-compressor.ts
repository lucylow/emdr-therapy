import type { Intent, Locale } from '../types.ts';
export type ContextEvent={intent:Intent;locale:Locale;kind:'question'|'answer'|'preference-confirmed'|'action-confirmed'|'correction';at:number;sourceId?:string};
export type CompactContext={locale:Locale;recentIntents:Intent[];confirmedPreferenceKeys:string[];lastSourceIds:string[];turnCount:number;ageMs:number};
/** Compresses typed events only; raw messages are not accepted by this interface. */
export function compressContext(events:ContextEvent[],now=Date.now(),maxRecent=6):CompactContext {
 const valid=events.filter(e=>Number.isFinite(e.at)&&e.at<=now&&e.at>=now-24*60*60_000);const recent=valid.slice(-Math.max(0,Math.min(maxRecent,10)));
 const pref=[...new Set(valid.filter(e=>e.kind==='preference-confirmed').map(e=>e.sourceId).filter((x):x is string=>!!x&&/^[a-z][a-z0-9_.-]{0,39}$/i.test(x)&&!/(diagnos|trauma|symptom|risk|medication|password|secret|transcript|reflection)/i.test(x)))].slice(-10);
 const src=[...new Set(valid.filter(e=>e.sourceId&&e.kind==='answer').map(e=>e.sourceId!))].slice(-5);
 return{locale:recent.at(-1)?.locale??'en',recentIntents:recent.map(e=>e.intent),confirmedPreferenceKeys:pref,lastSourceIds:src,turnCount:valid.length,ageMs:valid.length?now-valid[0]!.at:0};
}
export function contextToProviderHints(context:CompactContext):string {
 const rows:string[]=[];rows.push(`Conversation language: ${context.locale}`);if(context.recentIntents.length)rows.push(`Recent app topics: ${context.recentIntents.slice(-4).join(', ')}`);if(context.confirmedPreferenceKeys.length)rows.push(`User-confirmed preference keys: ${context.confirmedPreferenceKeys.join(', ')}`);if(context.lastSourceIds.length)rows.push(`Previously used reviewed article IDs: ${context.lastSourceIds.join(', ')}`);return rows.join('\n').slice(0,1200);
}
