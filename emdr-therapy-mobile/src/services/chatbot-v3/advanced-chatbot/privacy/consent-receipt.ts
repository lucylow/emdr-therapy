import type { Locale } from '../types.ts';
export type ConsentPurpose = 'remote-processing' | 'conversation-history' | 'personalization' | 'anonymous-metrics' | 'reflection-analysis';
export type ConsentChoice = 'granted' | 'denied' | 'revoked';
export type ConsentReceipt = { purpose: ConsentPurpose; choice: ConsentChoice; disclosureVersion: string; locale: Locale; updatedAt: number; expiresAt?: number };
export type ConsentCheck = { allowed: boolean; reason: 'valid-grant' | 'not-granted' | 'revoked' | 'disclosure-outdated' | 'expired' | 'purpose-mismatch' };
const PURPOSES = new Set<ConsentPurpose>(['remote-processing','conversation-history','personalization','anonymous-metrics','reflection-analysis']);
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/;

/** Consent receipt model for a host-provided local store. It records choices, not user identity or chat text. */
export class ConsentReceiptLedger {
  private readonly receipts = new Map<ConsentPurpose, ConsentReceipt>();
  constructor(private currentDisclosureVersion: string, private readonly options: { maxAgeMs?: number } = {}) {
    if (!VERSION.test(currentDisclosureVersion)) throw new Error('Invalid disclosure version');
  }
  record(input: { purpose: ConsentPurpose; choice: ConsentChoice; disclosureVersion: string; locale: Locale; now?: number; expiresAt?: number }): ConsentReceipt {
    if (!PURPOSES.has(input.purpose) || !VERSION.test(input.disclosureVersion) || !isLocale(input.locale)) throw new Error('Invalid consent receipt');
    const now = finiteTime(input.now ?? Date.now());
    const expiresAt = input.expiresAt === undefined ? undefined : finiteTime(input.expiresAt);
    if (expiresAt !== undefined && (expiresAt <= now || expiresAt - now > clamp(this.options.maxAgeMs ?? 365 * 86400_000, 60_000, 2 * 365 * 86400_000))) throw new Error('Invalid consent expiry');
    const receipt: ConsentReceipt = { purpose: input.purpose, choice: input.choice, disclosureVersion: input.disclosureVersion, locale: input.locale, updatedAt: now, ...(expiresAt === undefined ? {} : { expiresAt }) };
    this.receipts.set(input.purpose, receipt); return { ...receipt };
  }
  check(purpose: ConsentPurpose, now = Date.now()): ConsentCheck {
    if (!PURPOSES.has(purpose)) return { allowed:false, reason:'purpose-mismatch' };
    const receipt = this.receipts.get(purpose);
    if (!receipt) return { allowed:false, reason:'not-granted' };
    if (receipt.choice === 'revoked') return { allowed:false, reason:'revoked' };
    if (receipt.choice !== 'granted') return { allowed:false, reason:'not-granted' };
    if (receipt.disclosureVersion !== this.currentDisclosureVersion) return { allowed:false, reason:'disclosure-outdated' };
    if (receipt.expiresAt !== undefined && receipt.expiresAt < now) return { allowed:false, reason:'expired' };
    return { allowed:true, reason:'valid-grant' };
  }
  updateDisclosureVersion(version: string): void { if (!VERSION.test(version)) throw new Error('Invalid disclosure version'); this.currentDisclosureVersion = version; }
  receipt(purpose: ConsentPurpose): ConsentReceipt | undefined { const row=this.receipts.get(purpose);return row?{...row}:undefined; }
  snapshot(): ConsentReceipt[] { return [...this.receipts.values()].map(r=>({...r})); }
  revoke(purpose: ConsentPurpose, locale: Locale, now=Date.now()): ConsentReceipt { return this.record({purpose,choice:'revoked',disclosureVersion:this.currentDisclosureVersion,locale,now}); }
  clear(): void { this.receipts.clear(); }
}
function finiteTime(n:number):number{if(!Number.isFinite(n)||n<0)throw new Error('Invalid timestamp');return Math.floor(n);}
function clamp(n:number,min:number,max:number):number{return Number.isFinite(n)?Math.max(min,Math.min(max,Math.floor(n))):min;}
function isLocale(v:string):v is Locale{return v==='en'||v==='fr'||v==='es';}
