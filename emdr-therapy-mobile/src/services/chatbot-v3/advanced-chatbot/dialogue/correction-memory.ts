import type { Intent, Locale } from '../types.ts';
export type CorrectionResult = { accepted: boolean; intent?: Intent; reason: 'explicit-correction'|'not-a-correction'|'unsupported-intent'|'expired' };
export type CorrectionState = { correctedIntent: Intent; at: number; expiresAt: number; locale: Locale };
const ALLOWED = new Set<Intent>(['app_help','emdr_definition','grounding','breathing','session_setup','adjust_speed','adjust_duration','adjust_audio','adjust_visual','pause','resume','stop','privacy','feedback','greeting','farewell','clarify','unknown']);
const PHRASES: Record<Locale, Array<{rx:RegExp;intent:Intent}>> = {
 en:[{rx:/\b(i meant|i was asking about|no, i meant)\s+(?:the )?privacy\b/i,intent:'privacy'},{rx:/\b(i meant|i was asking about|no, i meant)\s+(?:how to )?pause\b/i,intent:'pause'},{rx:/\b(i meant|i was asking about|no, i meant)\s+(?:how to )?stop\b/i,intent:'stop'},{rx:/\b(i meant|i was asking about)\s+(?:the )?settings\b/i,intent:'app_help'},{rx:/\b(i meant|i was asking about)\s+(?:what )?emdr\b/i,intent:'emdr_definition'},{rx:/\b(i meant|i was asking about)\s+breathing\b/i,intent:'breathing'},{rx:/\b(i meant|i was asking about)\s+grounding\b/i,intent:'grounding'}],
 fr:[{rx:/\b(je voulais dire|non, je parle de)\s+(?:la )?confidentialite(?:$|\s)/i,intent:'privacy'},{rx:/\b(je voulais dire|non, je parle de)\s+(?:mettre en )?pause(?:$|\s)/i,intent:'pause'},{rx:/\b(je voulais dire|non, je parle de)\s+arreter(?:$|\s)/i,intent:'stop'},{rx:/\b(je voulais dire|je parlais des)\s+parametres(?:$|\s)/i,intent:'app_help'},{rx:/\b(je voulais dire|je parle de)\s+(?:la )?respiration(?:$|\s)/i,intent:'breathing'},{rx:/\b(je voulais dire|je parle de)\s+(?:l[' ])?ancrage(?:$|\s)/i,intent:'grounding'}],
 es:[{rx:/\b(queria decir|no, me referia a)\s+(?:la )?privacidad(?:$|\s)/i,intent:'privacy'},{rx:/\b(queria decir|no, me referia a)\s+pausar(?:$|\s)/i,intent:'pause'},{rx:/\b(queria decir|no, me referia a)\s+detener(?:$|\s)/i,intent:'stop'},{rx:/\b(queria decir|me referia a)\s+(?:los )?ajustes(?:$|\s)/i,intent:'app_help'},{rx:/\b(queria decir|me referia a)\s+respiracion(?:$|\s)/i,intent:'breathing'},{rx:/\b(queria decir|me referia a)\s+anclaje(?:$|\s)/i,intent:'grounding'}]
};
/** Stores only an intent label, never the correction text. Corrections are short-lived and never drive controls automatically. */
export class CorrectionMemory {
 private state?:CorrectionState;
 constructor(private ttlMs=5*60_000){this.ttlMs=Math.max(1000,Math.min(30*60_000,ttlMs));}
 parse(text:string,locale:Locale,now=Date.now()):CorrectionResult {
  const t=text.normalize('NFKC').normalize('NFD').replace(/\p{Diacritic}/gu,'').trim(); const rule=PHRASES[locale].find(r=>r.rx.test(t));
  if(!rule){const correction=/\b(i meant|no, i meant|je voulais dire|queria decir)\b/i.test(t);return{accepted:false,reason:correction?'unsupported-intent':'not-a-correction'};}
  if(!ALLOWED.has(rule.intent))return{accepted:false,reason:'unsupported-intent'};
  this.state={correctedIntent:rule.intent,at:now,expiresAt:now+this.ttlMs,locale};return{accepted:true,intent:rule.intent,reason:'explicit-correction'};
 }
 current(now=Date.now()):CorrectionState|undefined { if(!this.state)return undefined;if(this.state.expiresAt<now){this.state=undefined;return undefined;}return{...this.state}; }
 consume(now=Date.now()):CorrectionResult {const state=this.current(now);if(!state)return{accepted:false,reason:'expired'};this.state=undefined;return{accepted:true,intent:state.correctedIntent,reason:'explicit-correction'};}
 clear():void{this.state=undefined;}
}
