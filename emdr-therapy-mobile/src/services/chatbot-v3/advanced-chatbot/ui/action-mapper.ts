import type { ActionSuggestion } from '../types.ts';
import { isAllowedCapability, type Capability, DEFAULT_CAPABILITIES } from '../policy/action-policy.ts';
export type TrustedHandler=(parameters?:Record<string,string|number|boolean>)=>void;
export type ActionDispatch={ok:boolean;reason:string;run?:()=>void};
/** Host supplies trusted callbacks; model text can only refer to allowlisted static IDs. */
export function prepareActionDispatch(suggestion:ActionSuggestion,handlers:ReadonlyMap<string,TrustedHandler>,capabilities:readonly Capability[]=DEFAULT_CAPABILITIES):ActionDispatch {
  if(!isAllowedCapability(suggestion.id,capabilities))return {ok:false,reason:'action-not-allowlisted'};
  const handler=handlers.get(suggestion.id);if(!handler)return {ok:false,reason:'host-handler-missing'};
  if(suggestion.requiresConfirmation)return {ok:false,reason:'confirmation-required'};
  const params=validatedParameters(suggestion.parameters);if(!params.ok)return {ok:false,reason:params.reason};
  return {ok:true,reason:'prepared-not-executed',run:()=>handler(params.value)};
}
function validatedParameters(input:ActionSuggestion['parameters']):{ok:true;value?:Record<string,string|number|boolean>}|{ok:false;reason:string} {
  if(!input)return {ok:true};const allowed=new Set(['value','unit','option']);const entries=Object.entries(input);
  if(entries.length>5||entries.some(([k,v])=>!allowed.has(k)||!['string','number','boolean'].includes(typeof v)))return {ok:false,reason:'invalid-action-parameters'};
  return {ok:true,value:Object.fromEntries(entries)};
}
