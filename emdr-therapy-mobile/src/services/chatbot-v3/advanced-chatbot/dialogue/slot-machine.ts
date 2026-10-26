export type SettingSlot='durationMinutes'|'speedMultiplier'|'audioEnabled'|'visualColor';
export type SlotValue=number|boolean|string;
export type SettingSlotProposal={slot:SettingSlot;value:SlotValue;display:string;requiresConfirmation:true;source:'explicit-user-request';createdAt:number};
export type SlotParse={ok:true;proposal:SettingSlotProposal}|{ok:false;reason:'unrecognized'|'out-of-range'|'ambiguous'|'unsupported-value'};
const COLORS=new Set(['teal','blue','violet','green','amber','white']);
export function parseSettingSlotProposal(text:string,now=Date.now()):SlotParse {
 const t=text.normalize('NFKC').toLocaleLowerCase().trim();
 const duration=t.match(/\b(\d{1,2})\s*(?:minutes?|mins?|min)\b/);if(duration){const n=Number(duration[1]);if(n<1||n>30)return{ok:false,reason:'out-of-range'};if(!/(duration|session|longer|shorter|set|make it|séance|durée|sesión|duración)/i.test(t))return{ok:false,reason:'ambiguous'};return{ok:true,proposal:{slot:'durationMinutes',value:n,display:`${n} minutes`,requiresConfirmation:true,source:'explicit-user-request',createdAt:now}};}
 const speed=t.match(/\b(\d+(?:\.\d+)?|0?\.\d+)\s*x\b/);if(speed){const n=Number(speed[1]);if(n<0.2||n>3)return{ok:false,reason:'out-of-range'};return{ok:true,proposal:{slot:'speedMultiplier',value:n,display:`${n}× speed`,requiresConfirmation:true,source:'explicit-user-request',createdAt:now}};}
 if(/\b(turn|switch|set|enable|activate) (?:the )?(?:audio|sound) (?:on|enabled)\b/i.test(t)||/\b(audio|sound) on\b/i.test(t))return{ok:true,proposal:{slot:'audioEnabled',value:true,display:'Audio on',requiresConfirmation:true,source:'explicit-user-request',createdAt:now}};
 if(/\b(turn|switch|set|disable|deactivate) (?:the )?(?:audio|sound) (?:off|disabled)\b/i.test(t)||/\b(audio|sound) off\b/i.test(t))return{ok:true,proposal:{slot:'audioEnabled',value:false,display:'Audio off',requiresConfirmation:true,source:'explicit-user-request',createdAt:now}};
 const color=t.match(/\b(?:color|colour|coloris|couleur|color)\s+(teal|blue|violet|green|amber|white|azul|verde|blanco|bleu|vert|blanc)\b/i);if(color){const raw=color[1]!.toLowerCase();const map:Record<string,string>={azul:'blue',verde:'green',blanco:'white',bleu:'blue',vert:'green',blanc:'white'};const value=map[raw]??raw;if(!COLORS.has(value))return{ok:false,reason:'unsupported-value'};return{ok:true,proposal:{slot:'visualColor',value,display:`Color: ${value}`,requiresConfirmation:true,source:'explicit-user-request',createdAt:now}};}
 return{ok:false,reason:'unrecognized'};
}
export function confirmSettingSlotProposal(proposal:SettingSlotProposal,confirmed:boolean):{applied:boolean;slot?:SettingSlot;value?:SlotValue;reason:string}{if(!confirmed)return{applied:false,reason:'user-did-not-confirm'};if(proposal.requiresConfirmation!==true)return{applied:false,reason:'confirmation-flag-required'};return{applied:true,slot:proposal.slot,value:proposal.value,reason:'confirmed-by-user'};}
