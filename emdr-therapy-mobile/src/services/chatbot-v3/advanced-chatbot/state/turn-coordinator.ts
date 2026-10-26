export type TurnTicket={id:string;conversationId:string;startedAt:number;state:'running'|'cancelled'|'completed';};
export class TurnCoordinator {
 private readonly turns=new Map<string,TurnTicket>();private counter=0;
 start(conversationId:string,now=Date.now()):{ticket:TurnTicket;superseded?:TurnTicket} {
  const previous=this.turns.get(conversationId);if(previous?.state==='running')this.turns.set(conversationId,{...previous,state:'cancelled'});
  const ticket:TurnTicket={id:`turn-${(++this.counter).toString(36)}-${now.toString(36)}`,conversationId,startedAt:now,state:'running'};this.turns.set(conversationId,ticket);return {ticket:{...ticket},superseded:previous?{...previous,state:previous.state==='running'?'cancelled':previous.state}:undefined};
 }
 isCurrent(ticket:TurnTicket):boolean {const current=this.turns.get(ticket.conversationId);return !!current&&current.id===ticket.id&&current.state==='running';}
 finish(ticket:TurnTicket):boolean {if(!this.isCurrent(ticket))return false;this.turns.set(ticket.conversationId,{...ticket,state:'completed'});return true;}
 cancelConversation(id:string):boolean {const t=this.turns.get(id);if(!t)return false;this.turns.set(id,{...t,state:'cancelled'});return true;}
 clear(id:string):void{this.turns.delete(id);}
 clearAll():void{this.turns.clear();}
 prune(before:number):number{let n=0;for(const [id,t] of this.turns)if(t.startedAt<before&&t.state!=='running'){this.turns.delete(id);n++;}return n;}
}
