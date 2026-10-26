import type { ActionSuggestion } from '../types.ts';

export type HostActionId = 'pause'|'resume'|'stop'|'open_settings'|'open_privacy'|'start_grounding'|'start_breathing'|'set_visual_speed'|'set_duration'|'set_audio_enabled'|'set_visual_color';
export type HostAction = { id: HostActionId; parameters: Record<string,string|number|boolean>; requiresConfirmation: boolean };
export type ActionValidation = { ok: true; action: HostAction } | { ok:false; reason:'unknown-action'|'unsupported-capability'|'invalid-parameters'|'out-of-range'|'confirmation-required' };
export type HostCapabilities = Partial<Record<HostActionId, boolean>>;
const IDS = new Set<HostActionId>(['pause','resume','stop','open_settings','open_privacy','start_grounding','start_breathing','set_visual_speed','set_duration','set_audio_enabled','set_visual_color']);
const COLORS = new Set(['teal','blue','violet','green','amber','white']);
const NO_PARAMS = new Set<HostActionId>(['pause','resume','stop','open_settings','open_privacy','start_grounding','start_breathing']);
/** Validates a proposal only; it does not execute an action. The host must dispatch it separately. */
export function validateHostAction(id: string, parameters: unknown, capabilities: HostCapabilities, userConfirmed = false): ActionValidation {
  if (!IDS.has(id as HostActionId)) return {ok:false,reason:'unknown-action'};
  const typed = id as HostActionId;
  if (capabilities[typed] !== true) return {ok:false,reason:'unsupported-capability'};
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return {ok:false,reason:'invalid-parameters'};
  const p = parameters as Record<string,unknown>;
  if (NO_PARAMS.has(typed) && Object.keys(p).length) return {ok:false,reason:'invalid-parameters'};
  if (typed==='set_visual_speed') { if (Object.keys(p).some(k=>k!=='speed') || typeof p.speed!=='number') return {ok:false,reason:'invalid-parameters'}; if(p.speed<0.2||p.speed>3) return {ok:false,reason:'out-of-range'}; }
  if (typed==='set_duration') { if(Object.keys(p).some(k=>k!=='minutes')||typeof p.minutes!=='number')return{ok:false,reason:'invalid-parameters'};if(p.minutes<1||p.minutes>30)return{ok:false,reason:'out-of-range'}; }
  if (typed==='set_audio_enabled') { if(Object.keys(p).some(k=>k!=='enabled')||typeof p.enabled!=='boolean')return{ok:false,reason:'invalid-parameters'}; }
  if (typed==='set_visual_color') { if(Object.keys(p).some(k=>k!=='color')||typeof p.color!=='string'||!COLORS.has(p.color))return{ok:false,reason:'invalid-parameters'}; }
  if (!NO_PARAMS.has(typed) && !['set_visual_speed','set_duration','set_audio_enabled','set_visual_color'].includes(typed)) return {ok:false,reason:'invalid-parameters'};
  const confirmation = !['stop','pause','resume'].includes(typed);
  if(confirmation&&!userConfirmed)return{ok:false,reason:'confirmation-required'};
  return {ok:true,action:{id:typed,parameters:p as Record<string,string|number|boolean>,requiresConfirmation:confirmation}};
}
export function validateSuggestedAction(action: ActionSuggestion, capabilities: HostCapabilities): ActionValidation {
  return validateHostAction(action.id, action.parameters ?? {}, capabilities, !action.requiresConfirmation);
}
export function allowedHostActions(capabilities: HostCapabilities): HostActionId[] { return [...IDS].filter(id=>capabilities[id]===true); }
