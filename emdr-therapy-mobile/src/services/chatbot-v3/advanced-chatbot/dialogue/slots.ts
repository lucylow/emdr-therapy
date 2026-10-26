import type { DialogueSlot, ExtractedEntity, Intent } from '../types.ts';

export type SlotMutation = { name:string; value:string|number|boolean; source:'explicit-user'; requiresConfirmation:boolean };
const ALLOWED_SLOT_NAMES = new Set(['durationMinutes','movementSpeed','audioEnabled','visualColor','reducedMotion','locale']);
export function entityToSlot(entity: ExtractedEntity, intent: Intent, now=Date.now()): SlotMutation | undefined {
  if (entity.kind==='duration' && typeof entity.value==='number') {
    const minutes = entity.unit==='hours' ? entity.value*60 : entity.unit==='seconds' ? Math.max(1, Math.round(entity.value/60)) : entity.value;
    if (minutes<1 || minutes>120) return undefined;
    return {name:'durationMinutes',value:minutes,source:'explicit-user',requiresConfirmation:true};
  }
  if (entity.kind==='speed' && typeof entity.value==='number') {
    if (entity.value<1 || entity.value>240) return undefined;
    return {name:'movementSpeed',value:entity.value,source:'explicit-user',requiresConfirmation:true};
  }
  if (entity.kind==='feature' && entity.value==='audio-off') return {name:'audioEnabled',value:false,source:'explicit-user',requiresConfirmation:true};
  if (entity.kind==='feature' && entity.value==='audio-on') return {name:'audioEnabled',value:true,source:'explicit-user',requiresConfirmation:true};
  if (entity.kind==='language' && ['en','fr','es'].includes(String(entity.value))) return {name:'locale',value:String(entity.value),source:'explicit-user',requiresConfirmation:true};
  if (intent==='adjust_speed' && entity.value==='speed-slower') return {name:'movementSpeed',value:'decrease',source:'explicit-user',requiresConfirmation:true};
  if (intent==='adjust_speed' && entity.value==='speed-faster') return {name:'movementSpeed',value:'increase',source:'explicit-user',requiresConfirmation:true};
  return undefined;
}
export function mergeConfirmedSlot(slots:DialogueSlot[], mutation:SlotMutation, now=Date.now()):DialogueSlot[] {
  if (!ALLOWED_SLOT_NAMES.has(mutation.name)) throw new Error(`Slot ${mutation.name} is not allowlisted`);
  if (mutation.requiresConfirmation) throw new Error('Cannot persist a mutation that still requires confirmation');
  const next=slots.filter(s=>s.name!==mutation.name);
  next.push({name:mutation.name,value:mutation.value,confirmed:true,updatedAt:now});
  return next;
}
export function applyConfirmedMutation(slots:DialogueSlot[], mutation:SlotMutation, confirmed:boolean, now=Date.now()):DialogueSlot[] {
  if (!confirmed) return slots.map(s=>({...s}));
  return mergeConfirmedSlot(slots,{...mutation,requiresConfirmation:false},now);
}
