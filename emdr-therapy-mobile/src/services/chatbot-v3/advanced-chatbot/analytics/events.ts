/** Allowlisted, payload-free telemetry. Never pass message text, names, IPs, or identifiers. */
export type EventName='turn_started'|'local_answer'|'retrieval_hit'|'retrieval_miss'|'remote_blocked'|'remote_success'|'remote_failure'|'safety_override'|'confirmation_requested'|'confirmation_declined'|'rate_limited'|'output_blocked';
export type SafeEvent={name:EventName;at:number;intent?:string;locale?:'en'|'fr'|'es';mode?:string;reasonCode?:string};
const NAMES=new Set<EventName>(['turn_started','local_answer','retrieval_hit','retrieval_miss','remote_blocked','remote_success','remote_failure','safety_override','confirmation_requested','confirmation_declined','rate_limited','output_blocked']);
export function safeEvent(input:SafeEvent):SafeEvent {
  if(!NAMES.has(input.name))throw new Error('Unknown telemetry event');
  const out:SafeEvent={name:input.name,at:Number.isFinite(input.at)?input.at:Date.now()};
  if(input.intent&&/^[a-z_-]{1,40}$/i.test(input.intent))out.intent=input.intent;
  if(input.locale&&['en','fr','es'].includes(input.locale))out.locale=input.locale;
  if(input.mode&&/^[a-z_-]{1,40}$/i.test(input.mode))out.mode=input.mode;
  if(input.reasonCode&&/^[a-z0-9_-]{1,60}$/i.test(input.reasonCode))out.reasonCode=input.reasonCode;
  return out;
}
export function ensureNoPersonalText(event:SafeEvent):boolean{return Object.keys(event).every(key=>['name','at','intent','locale','mode','reasonCode'].includes(key));}
