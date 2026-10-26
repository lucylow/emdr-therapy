import type { ActionSuggestion } from '../types.ts';
export type PendingAction={token:string;conversationId:string;actionId:string;createdAt:number;expiresAt:number;consumed:boolean};
export class OneShotActionLedger {
  private records=new Map<string,PendingAction>();
  constructor(private readonly ttlMs=30_000,private readonly maxRecords=500){}
  issue(conversationId:string,action:ActionSuggestion,now=Date.now()):PendingAction {
    if(!action.requiresConfirmation)throw new Error('Only actions marked for confirmation belong in the ledger');
    this.prune(now);if(this.records.size>=this.maxRecords)this.records.delete(this.records.keys().next().value as string);
    const token=makeToken();const record={token,conversationId:conversationId.slice(0,120),actionId:action.id,createdAt:now,expiresAt:now+this.ttlMs,consumed:false};this.records.set(token,record);return {...record};
  }
  consume(token:string,conversationId:string,now=Date.now()):{ok:boolean;actionId?:string;reason:string} {
    const r=this.records.get(token);if(!r)return {ok:false,reason:'unknown-token'};
    if(r.consumed){this.records.delete(token);return {ok:false,reason:'already-consumed'};}
    if(r.conversationId!==conversationId){this.records.delete(token);return {ok:false,reason:'conversation-mismatch'};}
    if(now>r.expiresAt){this.records.delete(token);return {ok:false,reason:'expired'};}
    r.consumed=true;this.records.delete(token);return {ok:true,actionId:r.actionId,reason:'one-shot-approved'};
  }
  clearConversation(id:string):void{for(const [key,r] of this.records)if(r.conversationId===id)this.records.delete(key);}
  clearAll():void{this.records.clear();}
  prune(now=Date.now()):number{let n=0;for(const [k,r] of this.records)if(now>r.expiresAt){this.records.delete(k);n++;}return n;}
}
function makeToken():string {const bytes=new Uint8Array(12);const c=(globalThis as {crypto?:{getRandomValues?:(a:Uint8Array)=>Uint8Array}}).crypto;if(c?.getRandomValues)c.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
