export type RequestTicket={id:string;conversationId:string;signal:AbortSignal;startedAt:number};
/** Tracks cancellable requests by conversation without storing request text. */
export class RequestLifecycle {
 private active=new Map<string,{conversationId:string;controller:AbortController;startedAt:number}>();private sequence=0;
 begin(conversationId:string,now=Date.now()):RequestTicket {this.cancelConversation(conversationId);const id=`r${(++this.sequence).toString(36)}-${now.toString(36)}`;const controller=new AbortController();this.active.set(id,{conversationId,controller,startedAt:now});return{id,conversationId,signal:controller.signal,startedAt:now};}
 finish(id:string):boolean{return this.active.delete(id);}
 cancel(id:string,reason='cancelled'):boolean{const r=this.active.get(id);if(!r)return false;r.controller.abort(reason);this.active.delete(id);return true;}
 cancelConversation(conversationId:string,reason='conversation-interrupted'):number{let count=0;for(const [id,r]of this.active){if(r.conversationId===conversationId){r.controller.abort(reason);this.active.delete(id);count++;}}return count;}
 cancelAll(reason='runtime-cleared'):number{const count=this.active.size;for(const r of this.active.values())r.controller.abort(reason);this.active.clear();return count;}
 isActive(id:string):boolean{return this.active.has(id);}
 size():number{return this.active.size;}
 getActiveMetadata():Array<{id:string;conversationId:string;startedAt:number}>{return [...this.active.entries()].map(([id,r])=>({id,conversationId:r.conversationId,startedAt:r.startedAt}));}
}
export async function awaitWithAbort<T>(promise:Promise<T>,signal:AbortSignal):Promise<T>{if(signal.aborted)throw new Error('Request cancelled');return await new Promise<T>((resolve,reject)=>{const onAbort=()=>{cleanup();reject(new Error('Request cancelled'));};const cleanup=()=>signal.removeEventListener('abort',onAbort);signal.addEventListener('abort',onAbort,{once:true});promise.then(value=>{cleanup();resolve(value);},err=>{cleanup();reject(err);});});}
