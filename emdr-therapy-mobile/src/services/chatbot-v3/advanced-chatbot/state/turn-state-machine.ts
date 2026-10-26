export type TurnStatus='idle'|'validating'|'routing'|'retrieving'|'waiting-provider'|'reviewing-output'|'complete'|'cancelled'|'failed';
export type TurnEvent='START'|'VALID'|'ROUTED'|'RETRIEVE'|'PROVIDER_START'|'PROVIDER_DONE'|'REVIEW'|'COMPLETE'|'CANCEL'|'FAIL'|'RESET';
export type TurnMachine={status:TurnStatus;turnId?:string;changedAt:number;history:TurnStatus[];errorCode?:string};
const TRANSITIONS:Record<TurnStatus,Partial<Record<TurnEvent,TurnStatus>>>={
 idle:{START:'validating'},validating:{VALID:'routing',CANCEL:'cancelled',FAIL:'failed'},routing:{ROUTED:'retrieving',REVIEW:'reviewing-output',CANCEL:'cancelled',FAIL:'failed'},
 retrieving:{REVIEW:'reviewing-output',PROVIDER_START:'waiting-provider',COMPLETE:'complete',CANCEL:'cancelled',FAIL:'failed'},
 'waiting-provider':{PROVIDER_DONE:'reviewing-output',CANCEL:'cancelled',FAIL:'failed'},'reviewing-output':{COMPLETE:'complete',FAIL:'failed',CANCEL:'cancelled'},
 complete:{RESET:'idle'},cancelled:{RESET:'idle'},failed:{RESET:'idle'},
};
export function initialTurnMachine(now=Date.now()):TurnMachine{return {status:'idle',changedAt:now,history:['idle']};}
export function transitionTurn(machine:TurnMachine,event:TurnEvent,now=Date.now(),metadata:{turnId?:string;errorCode?:string}={}):TurnMachine {
  const target=TRANSITIONS[machine.status][event];if(!target)throw new Error(`Invalid turn transition: ${machine.status} --${event}--> ?`);
  return {status:target,turnId:metadata.turnId??machine.turnId,changedAt:now,history:[...machine.history,target].slice(-12),errorCode:target==='failed'?(metadata.errorCode??'unspecified'):undefined};
}
export function canCancelTurn(status:TurnStatus):boolean{return !['complete','cancelled','failed','idle'].includes(status);}
export function turnIsTerminal(status:TurnStatus):boolean{return ['complete','cancelled','failed'].includes(status);}
