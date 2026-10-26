import type { Intent } from '../types.ts';
export type FeatureChange='audioEnabled'|'durationMinutes'|'movementSpeed'|'reducedMotion'|'visualColor';
export type FeatureProposal={id:string;key:FeatureChange;value:string|number|boolean;createdAt:number;expiresAt:number;reason:'explicit-user-request';};
export class FeatureConfirmationQueue {
 private queue:FeatureProposal[]=[];
 constructor(private readonly ttlMs=60_000,private readonly capacity=5){}
 propose(key:FeatureChange,value:string|number|boolean,now=Date.now()):FeatureProposal {
  validateValue(key,value);this.prune(now);const proposal={id:proposalId(),key,value,createdAt:now,expiresAt:now+this.ttlMs,reason:'explicit-user-request' as const};this.queue.push(proposal);if(this.queue.length>this.capacity)this.queue.shift();return {...proposal};
 }
 pending(now=Date.now()):FeatureProposal[]{this.prune(now);return this.queue.map(p=>({...p}));}
 confirm(id:string,accepted:boolean,now=Date.now()):{applied:boolean;proposal?:FeatureProposal;reason:string} {
  const index=this.queue.findIndex(p=>p.id===id);if(index<0)return {applied:false,reason:'proposal-not-found'};const [proposal]=this.queue.splice(index,1);
  if(now>proposal.expiresAt)return {applied:false,proposal,reason:'proposal-expired'};if(!accepted)return {applied:false,proposal,reason:'user-declined'};return {applied:true,proposal,reason:'user-confirmed'};
 }
 clear():void{this.queue=[];}
 private prune(now:number):void{this.queue=this.queue.filter(p=>now<=p.expiresAt);}
}
function validateValue(key:FeatureChange,value:string|number|boolean):void {
 if(key==='audioEnabled'||key==='reducedMotion'){if(typeof value!=='boolean')throw new TypeError(`Invalid value for ${key}`);return;}
 if(key==='durationMinutes'){if(typeof value!=='number'||!Number.isFinite(value)||value<1||value>120)throw new RangeError('durationMinutes must be 1-120');return;}
 if(key==='movementSpeed'){if(typeof value!=='number'||!Number.isFinite(value)||value<1||value>120)throw new RangeError('movementSpeed must be 1-120');return;}
 if(key==='visualColor'){if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))throw new TypeError('visualColor must be a hex color');}
}
function proposalId():string{return Math.random().toString(36).slice(2,12);}
export function intentCanCreateFeatureProposal(intent:Intent):boolean{return ['adjust_audio','adjust_duration','adjust_speed','adjust_visual','session_setup'].includes(intent);}
