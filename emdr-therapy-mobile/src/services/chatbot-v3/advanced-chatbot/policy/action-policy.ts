import type { ActionSuggestion, Intent } from '../types.ts';

export type CapabilityId = 'open_settings'|'open_grounding'|'open_breathing'|'show_audio_settings'|'show_visual_settings'|'open_privacy'|'pause_session'|'resume_session'|'stop_session';
export type Capability = { id:CapabilityId; labelKey:string; intents:Intent[]; requiresConfirmation:boolean; dangerous:boolean; enabled:boolean };
export const DEFAULT_CAPABILITIES:readonly Capability[] = Object.freeze([
  {id:'open_settings',labelKey:'open_settings',intents:['app_help','session_setup'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'open_grounding',labelKey:'open_grounding',intents:['grounding'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'open_breathing',labelKey:'open_breathing',intents:['breathing'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'show_audio_settings',labelKey:'show_audio_settings',intents:['adjust_audio'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'show_visual_settings',labelKey:'show_visual_settings',intents:['adjust_visual','adjust_speed','adjust_duration'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'open_privacy',labelKey:'open_privacy',intents:['privacy'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'pause_session',labelKey:'pause_session',intents:['pause'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'resume_session',labelKey:'resume_session',intents:['resume'],requiresConfirmation:false,dangerous:false,enabled:true},
  {id:'stop_session',labelKey:'stop_session',intents:['stop'],requiresConfirmation:false,dangerous:true,enabled:true},
]);
export function suggestionsForIntent(intent:Intent, capabilities:readonly Capability[]=DEFAULT_CAPABILITIES):ActionSuggestion[] {
  return capabilities.filter(c=>c.enabled && c.intents.includes(intent)).slice(0,3).map(c=>({id:c.id,label:c.labelKey,requiresConfirmation:c.requiresConfirmation}));
}
export function isAllowedCapability(id:string, capabilities:readonly Capability[]=DEFAULT_CAPABILITIES):id is CapabilityId {
  return capabilities.some(c=>c.id===id && c.enabled);
}
/** Never execute this result directly. The host UI must map IDs to fixed handlers. */
export function authorizeSuggestion(suggestion:ActionSuggestion, capabilities:readonly Capability[]=DEFAULT_CAPABILITIES):{allowed:boolean;requiresConfirmation:boolean;reason:string} {
  const capability=capabilities.find(c=>c.id===suggestion.id && c.enabled);
  if (!capability) return {allowed:false,requiresConfirmation:true,reason:'unknown-or-disabled-capability'};
  if (suggestion.parameters && Object.keys(suggestion.parameters).some(k=>!['value','unit','option'].includes(k))) return {allowed:false,requiresConfirmation:true,reason:'unrecognized-parameter'};
  return {allowed:true,requiresConfirmation:capability.requiresConfirmation || capability.dangerous,reason:capability.dangerous?'dangerous-capability':capability.requiresConfirmation?'confirmation-required':'allowlisted'};
}
