import type { Capability, CapabilityId } from '../policy/action-policy.ts';
import { DEFAULT_CAPABILITIES } from '../policy/action-policy.ts';
export type HostCapabilitySnapshot={id:CapabilityId;enabled:boolean;accessible:boolean;note?:string};
export function intersectCapabilities(host:readonly HostCapabilitySnapshot[],definitions:readonly Capability[]=DEFAULT_CAPABILITIES):Capability[] {
 const byId=new Map(host.map(h=>[h.id,h]));return definitions.map(def=>{const live=byId.get(def.id);return {...def,enabled:def.enabled&&!!live?.enabled&&!!live.accessible};});
}
export function capabilityReadiness(host:readonly HostCapabilitySnapshot[],required:readonly CapabilityId[]):{ready:boolean;missing:CapabilityId[]} {
 const available=new Set(host.filter(h=>h.enabled&&h.accessible).map(h=>h.id));const missing=required.filter(id=>!available.has(id));return {ready:missing.length===0,missing:[...missing]};
}
