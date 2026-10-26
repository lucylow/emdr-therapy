export type StreamEvent={type:'text'|'done'|'error';text?:string;errorCode?:'cancelled'|'timeout'|'provider-error'|'oversized'|'invalid-chunk'};
export type StreamState='idle'|'streaming'|'completed'|'cancelled'|'failed';
export type SafeStreamSnapshot={state:StreamState;chunks:number;characters:number;buffer:string;reason?:string};
/** Buffers generated text before display to avoid partial unsafe output and runaway streams. */
export class SafeStreamBuffer {
 private state:StreamState='idle';private chunks=0;private characters=0;private buffer='';private reason?:string;
 constructor(private opts:{maxChars?:number;maxChunkChars?:number;minCharsBeforeDisplay?:number}={}){}
 push(chunk:unknown):{accepted:boolean;display:string;reason?:string}{if(this.state!=='idle'&&this.state!=='streaming')return{accepted:false,display:'',reason:'stream-not-open'};if(typeof chunk!=='string')return this.fail('invalid-chunk');if(chunk.length>(this.opts.maxChunkChars??3000))return this.fail('oversized');if(this.characters+chunk.length>(this.opts.maxChars??5000))return this.fail('oversized');this.state='streaming';this.chunks++;this.characters+=chunk.length;this.buffer+=chunk;const min=this.opts.minCharsBeforeDisplay??0;return{accepted:true,display:this.characters>=min?this.buffer:'',reason:undefined};}
 complete():StreamEvent {if(this.state==='cancelled')return{type:'error',errorCode:'cancelled'};if(this.state==='failed')return{type:'error',errorCode:this.reason as StreamEvent['errorCode']};if(this.state==='completed')return{type:'done',text:this.buffer};this.state='completed';return{type:'done',text:this.buffer};}
 cancel():void{if(this.state==='completed'||this.state==='failed')return;this.state='cancelled';this.reason='cancelled';this.buffer='';}
 fail(reason:'timeout'|'provider-error'|'oversized'|'invalid-chunk'): {accepted:false;display:'';reason:string}{this.state='failed';this.reason=reason;this.buffer='';return{accepted:false,display:'',reason};}
 reset():void{this.state='idle';this.chunks=0;this.characters=0;this.buffer='';this.reason=undefined;}
 snapshot():SafeStreamSnapshot{return{state:this.state,chunks:this.chunks,characters:this.characters,buffer:this.buffer,reason:this.reason};}
}
export function validateStreamEvent(value:unknown):value is StreamEvent {if(!value||typeof value!=='object')return false;const e=value as Record<string,unknown>;if(!['text','done','error'].includes(String(e.type)))return false;if(e.type==='text')return typeof e.text==='string'&&e.text.length<=3000;if(e.type==='done')return e.text===undefined||typeof e.text==='string';if(e.type==='error')return ['cancelled','timeout','provider-error','oversized','invalid-chunk'].includes(String(e.errorCode));return false;}
