export type TurnTask<T> = (signal:AbortSignal)=>Promise<T>;
export type TurnRunResult<T> = { accepted:true;value:T;sequence:number } | { accepted:false;reason:'busy'|'cancelled'|'capacity' };
type Lane={tail:Promise<void>;controller?:AbortController;sequence:number;active:boolean;lastUsed:number};
/** Serializes async work per conversation, bounding simultaneous runs and enabling cancel/forget cleanup. */
export class SerialTurnRunner {
 private readonly lanes=new Map<string,Lane>();
 constructor(private readonly options:{maxConversations?:number;busyPolicy?:'reject'|'replace';idleTtlMs?:number}={}){}
 async run<T>(conversationId:string,task:TurnTask<T>,now=Date.now()):Promise<TurnRunResult<T>>{
  if(!validId(conversationId))return{accepted:false,reason:'capacity'};this.prune(now);
  let lane=this.lanes.get(conversationId);
  if(lane?.active){if(this.options.busyPolicy!=='replace')return{accepted:false,reason:'busy'};lane.controller?.abort();}
  if(!lane){if(this.lanes.size>=clamp(this.options.maxConversations??100,1,2000))return{accepted:false,reason:'capacity'};lane={tail:Promise.resolve(),sequence:0,active:false,lastUsed:now};this.lanes.set(conversationId,lane);}
  const sequence=++lane.sequence;const controller=new AbortController();lane.controller=controller;lane.active=true;lane.lastUsed=now;
  const prior=lane.tail;let release!:()=>void;lane.tail=new Promise<void>(resolve=>{release=resolve;});
  await prior;
  try{if(controller.signal.aborted)return{accepted:false,reason:'cancelled'};const value=await task(controller.signal);if(controller.signal.aborted)return{accepted:false,reason:'cancelled'};return{accepted:true,value,sequence};}
  catch(error){if(controller.signal.aborted)return{accepted:false,reason:'cancelled'};throw error;}
  finally{release();if(lane.controller===controller){lane.controller=undefined;lane.active=false;lane.lastUsed=Date.now();}}
 }
 cancel(conversationId:string):boolean{const lane=this.lanes.get(conversationId);if(!lane)return false;lane.controller?.abort();lane.active=false;lane.controller=undefined;lane.lastUsed=Date.now();return true;}
 clear(conversationId:string):boolean{const lane=this.lanes.get(conversationId);if(!lane)return false;lane.controller?.abort();this.lanes.delete(conversationId);return true;}
 clearAll():void{for(const lane of this.lanes.values())lane.controller?.abort();this.lanes.clear();}
 get size():number{return this.lanes.size;}
 private prune(now:number):void{const ttl=clamp(this.options.idleTtlMs??30*60_000,60_000,24*60*60_000);for(const[id,lane]of this.lanes)if(!lane.active&&now-lane.lastUsed>ttl)this.lanes.delete(id);}
}
function validId(id:string):boolean{return typeof id==='string'&&id.length>0&&id.length<=160&&!/[\u0000-\u001f\u007f]/.test(id);}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):min;}
