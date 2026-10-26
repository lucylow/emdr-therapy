import type { UserPreferences, Locale } from '../types.ts';
import { sanitizePreferences } from '../config.ts';
export type PreferenceRecord={preferences:UserPreferences;consentGiven:boolean;updatedAt:number;schemaVersion:1};
/** In-memory adapter; production persistence must use the platform's secure/local storage policy. */
export class LocalPreferenceStore {
  private readonly entries=new Map<string,PreferenceRecord>();
  constructor(private readonly maxUsers=5000){}
  read(userKey:string):PreferenceRecord|undefined {const row=this.entries.get(safeKey(userKey));return row?clone(row):undefined;}
  write(userKey:string,preferences:UserPreferences,consentGiven:boolean,now=Date.now()):PreferenceRecord {
    const key=safeKey(userKey);if(!consentGiven)throw new Error('Explicit preference consent is required');
    if(!this.entries.has(key)&&this.entries.size>=this.maxUsers)this.entries.delete(this.entries.keys().next().value as string);
    const previous=this.entries.get(key)?.preferences??{};
    const row:PreferenceRecord={preferences:{...previous,...sanitizePreferences(preferences)},consentGiven,updatedAt:now,schemaVersion:1};
    this.entries.set(key,row);return clone(row);
  }
  clear(userKey:string):boolean{return this.entries.delete(safeKey(userKey));}
  clearAll():void{this.entries.clear();}
  setLocale(userKey:string,locale:Locale,consent:boolean,now=Date.now()):PreferenceRecord{return this.write(userKey,{locale},consent,now);}
  revoke(userKey:string):void {const key=safeKey(userKey);this.entries.delete(key);}
  size():number{return this.entries.size;}
}
function safeKey(value:string):string {if(typeof value!=='string'||!value.trim()||value.length>160)throw new TypeError('Invalid preference key');return value.trim();}
function clone(row:PreferenceRecord):PreferenceRecord{return {...row,preferences:{...row.preferences,confirmedFeatures:row.preferences.confirmedFeatures?[...row.preferences.confirmedFeatures]:undefined}};}
