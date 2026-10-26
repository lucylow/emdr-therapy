import type { ExtractedEntity } from '../types.ts';
import { extractEntities } from '../entities.ts';
export type SettingProposal={setting:'durationMinutes'|'audioEnabled'|'movementSpeed';proposedValue:string|number|boolean;reason:string;requiresUserConfirmation:true;source:'user-message'};
export function proposeSettings(text:string,locale:'en'|'fr'|'es'='en'):SettingProposal[] {
  const entities=extractEntities(text,locale);const proposals:SettingProposal[]=[];
  for(const entity of entities){
    if(entity.kind==='duration'&&typeof entity.value==='number'){
      const n=entity.unit==='hours'?entity.value*60:entity.unit==='seconds'?Math.max(1,Math.round(entity.value/60)):entity.value;
      if(n>=1&&n<=120)proposals.push({setting:'durationMinutes',proposedValue:n,reason:'explicit-duration-mentioned',requiresUserConfirmation:true,source:'user-message'});
    }
    if(entity.kind==='feature'&&entity.value==='audio-on')proposals.push({setting:'audioEnabled',proposedValue:true,reason:'explicit-audio-request',requiresUserConfirmation:true,source:'user-message'});
    if(entity.kind==='feature'&&entity.value==='audio-off')proposals.push({setting:'audioEnabled',proposedValue:false,reason:'explicit-audio-request',requiresUserConfirmation:true,source:'user-message'});
    if(entity.kind==='speed'&&typeof entity.value==='number'&&entity.value<=120)proposals.push({setting:'movementSpeed',proposedValue:entity.value,reason:'explicit-speed-value-mentioned',requiresUserConfirmation:true,source:'user-message'});
  }
  return dedupe(proposals);
}
function dedupe(input:SettingProposal[]):SettingProposal[]{const m=new Map<string,SettingProposal>();for(const p of input)m.set(`${p.setting}:${p.proposedValue}`,p);return [...m.values()];}
export function confirmSettingProposal(proposal:SettingProposal,confirmed:boolean):{apply:boolean;setting?:SettingProposal['setting'];value?:string|number|boolean} {
  if(!confirmed)return {apply:false};return {apply:true,setting:proposal.setting,value:proposal.proposedValue};
}
