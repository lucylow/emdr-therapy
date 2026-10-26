import type { HostActionId } from './action-contract.ts';
export type ConfirmationProposal = { token: string; actionId: HostActionId; label: string; expiresAt: number };
export type ConfirmationDecision = { accepted: boolean; actionId?: HostActionId; reason: 'confirmed' | 'unknown-token' | 'expired' | 'wrong-action' | 'already-used' | 'cancelled' };
type Row = { actionId: HostActionId; label: string; expiresAt: number; used: boolean };
const ACTIONS = new Set<HostActionId>(['pause','resume','stop','open_settings','open_privacy','start_grounding','start_breathing','set_visual_speed','set_duration','set_audio_enabled','set_visual_color']);

/** Creates single-use confirmations; confirms intent, but never executes host actions. */
export class ConfirmationTokenStore {
  private readonly rows = new Map<string, Row>();
  private counter = 0;
  constructor(private readonly options: { ttlMs?: number; capacity?: number } = {}) {}
  propose(input: { actionId: HostActionId; label: string; now?: number }): ConfirmationProposal {
    if (!ACTIONS.has(input.actionId)) throw new Error('Unsupported host action');
    const now = input.now ?? Date.now(); this.prune(now);
    const ttl = clamp(this.options.ttlMs ?? 60_000, 1000, 5 * 60_000);
    const label = String(input.label).replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,120) || 'Confirm action';
    const token = `confirm-${(now >>> 0).toString(36)}-${(++this.counter).toString(36)}`;
    this.rows.set(token,{actionId:input.actionId,label,expiresAt:now+ttl,used:false});
    while(this.rows.size>clamp(this.options.capacity??100,1,1000))this.rows.delete(this.rows.keys().next().value as string);
    return { token,actionId:input.actionId,label,expiresAt:now+ttl };
  }
  confirm(token: string, actionId: HostActionId, now = Date.now()): ConfirmationDecision {
    this.prune(now); const row=this.rows.get(token);
    if(!row)return{accepted:false,reason:'unknown-token'};
    if(row.used)return{accepted:false,reason:'already-used'};
    if(row.expiresAt<now){this.rows.delete(token);return{accepted:false,reason:'expired'};}
    if(row.actionId!==actionId)return{accepted:false,reason:'wrong-action'};
    row.used=true; this.rows.delete(token); return{accepted:true,actionId:row.actionId,reason:'confirmed'};
  }
  cancel(token: string): ConfirmationDecision { const found=this.rows.delete(token);return{accepted:false,reason:found?'cancelled':'unknown-token'}; }
  clear(): void { this.rows.clear(); }
  get size(): number { return this.rows.size; }
  private prune(now:number):void{for(const [key,row]of this.rows)if(row.expiresAt<now||row.used)this.rows.delete(key);}
}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):min;}
