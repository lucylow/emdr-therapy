export type TypingState='idle'|'queued'|'thinking'|'streaming'|'retrying'|'complete'|'error'|'cancelled';
export type TypingEvent='submit'|'start'|'chunk'|'retry'|'success'|'failure'|'cancel'|'reset';
const TRANSITIONS:Record<TypingState,Partial<Record<TypingEvent,TypingState>>>= {
 idle:{submit:'queued',reset:'idle'},queued:{start:'thinking',cancel:'cancelled',failure:'error',reset:'idle'},thinking:{chunk:'streaming',retry:'retrying',success:'complete',failure:'error',cancel:'cancelled',reset:'idle'},streaming:{chunk:'streaming',success:'complete',failure:'error',cancel:'cancelled',reset:'idle'},retrying:{start:'thinking',failure:'error',cancel:'cancelled',reset:'idle'},complete:{submit:'queued',reset:'idle'},error:{submit:'queued',reset:'idle'},cancelled:{submit:'queued',reset:'idle'},
};
export class TypingStatusMachine {
 private current:TypingState='idle';private changedAt:number;private transitions=0;
 constructor(now=Date.now()){this.changedAt=now;}
 state():TypingState{return this.current;}
 move(event:TypingEvent,now=Date.now()):{ok:boolean;state:TypingState;reason?:string}{const next=TRANSITIONS[this.current][event];if(!next)return{ok:false,state:this.current,reason:`invalid-transition:${this.current}:${event}`};this.current=next;this.changedAt=now;this.transitions++;return{ok:true,state:this.current};}
 snapshot():{state:TypingState;changedAt:number;transitions:number}{return{state:this.current,changedAt:this.changedAt,transitions:this.transitions};}
 reset(now=Date.now()):void{this.current='idle';this.changedAt=now;this.transitions=0;}
}
