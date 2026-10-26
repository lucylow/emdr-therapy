import type { PendingQuestion } from '../types.ts';
import { isUnambiguousYes, isUnambiguousNo } from './followup.ts';
import type { Locale } from '../types.ts';

export type ConfirmationResult={status:'confirmed'|'declined'|'expired'|'unrecognized'|'missing';question?:PendingQuestion};
export class ConfirmationManager {
  private readonly pending=new Map<string,PendingQuestion>();
  constructor(private readonly ttlMs=90_000,private readonly maxPending=500){}
  create(conversationId:string,question:Omit<PendingQuestion,'id'|'createdAt'|'expiresAt'>,now=Date.now()):PendingQuestion {
    this.expire(now);
    if(this.pending.size>=this.maxPending)this.pending.delete(this.pending.keys().next().value as string);
    const record:PendingQuestion={...question,id:randomToken(),createdAt:now,expiresAt:now+this.ttlMs,options:[...question.options]};
    this.pending.set(this.key(conversationId),record);return {...record,options:[...record.options]};
  }
  resolve(conversationId:string,text:string,locale:Locale,now=Date.now()):ConfirmationResult {
    const key=this.key(conversationId);const question=this.pending.get(key);
    if(!question)return {status:'missing'};
    this.pending.delete(key);
    if(now>question.expiresAt)return {status:'expired',question};
    if(isUnambiguousYes(text,locale))return {status:'confirmed',question};
    if(isUnambiguousNo(text,locale))return {status:'declined',question};
    // One-shot semantics: ambiguous content consumes the pending question rather than replaying an old action.
    return {status:'unrecognized',question};
  }
  clear(conversationId:string):void{this.pending.delete(this.key(conversationId));}
  clearAll():void{this.pending.clear();}
  expire(now=Date.now()):number{let n=0;for(const [key,q] of this.pending)if(now>q.expiresAt){this.pending.delete(key);n++;}return n;}
  private key(id:string):string{return id.slice(0,120);}
}
function randomToken():string {
  // Not a secret or authorization token; uniqueness is only for tracking a one-use UI confirmation.
  const bytes=new Uint8Array(16);
  const cryptoObject=(globalThis as {crypto?:{getRandomValues?:(a:Uint8Array)=>Uint8Array}}).crypto;
  if(cryptoObject?.getRandomValues)cryptoObject.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
