import type { UserPreferences } from '../types.ts';
import { LocalPreferenceStore } from '../personalization/preference-store.ts';
import { DialogueSessionStore } from '../dialogue/session-store.ts';
import { EphemeralTopicMemory } from '../dialogue/topic-memory.ts';
export type DeletionSummary={preferencesDeleted:boolean;dialogueCleared:boolean;topicsCleared:boolean;feedbackCleared:boolean};
export interface Resettable {reset():void;clearAll?():void}
/** Centralized local erasure hook; actual platform storage must be passed in by the host app. */
export class LocalDataController {
  constructor(private preferences:LocalPreferenceStore,private sessions:DialogueSessionStore,private topicMemory?:EphemeralTopicMemory,private feedback?:Resettable){}
  exportPreference(userKey:string):UserPreferences|undefined {const record=this.preferences.read(userKey);return record?{...record.preferences}:undefined;}
  deleteUserData(userKey:string,conversationId?:string):DeletionSummary {
    const preferencesDeleted=this.preferences.clear(userKey);
    if(conversationId)this.sessions.clear(conversationId);else this.sessions.clearAll();
    this.topicMemory?.clear();if(this.feedback?.clearAll)this.feedback.clearAll();else this.feedback?.reset();
    return {preferencesDeleted,dialogueCleared:true,topicsCleared:!!this.topicMemory,feedbackCleared:!!this.feedback};
  }
  resetCurrentSession(conversationId:string):void {this.sessions.clear(conversationId);}
}
