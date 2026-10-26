export type CircuitState='closed'|'open'|'half-open';
export type CircuitOptions={failureThreshold?:number;cooldownMs?:number;successThreshold?:number};
export class CircuitBreaker {
  private state:CircuitState='closed'; private failures=0; private successes=0; private openedAt=0; private probeInFlight=false;
  private readonly failureThreshold:number; private readonly cooldownMs:number; private readonly successThreshold:number;
  constructor(options:CircuitOptions={}) {this.failureThreshold=options.failureThreshold??3;this.cooldownMs=options.cooldownMs??15_000;this.successThreshold=options.successThreshold??1;}
  getState(now=Date.now()):CircuitState { if(this.state==='open'&&now-this.openedAt>=this.cooldownMs) return 'half-open'; return this.state; }
  allow(now=Date.now()):boolean {
    const current=this.getState(now);
    if(current==='closed') return true;
    if(current==='open') return false;
    this.state='half-open';
    if(this.probeInFlight) return false;
    this.probeInFlight=true; return true;
  }
  success(now=Date.now()):void {
    if(this.state==='half-open') {this.successes++; this.probeInFlight=false; if(this.successes>=this.successThreshold){this.state='closed';this.failures=0;this.successes=0;}}
    else {this.failures=0;this.state='closed';}
    void now;
  }
  failure(now=Date.now()):void {
    this.probeInFlight=false;this.successes=0;this.failures++;
    if(this.state==='half-open'||this.failures>=this.failureThreshold){this.state='open';this.openedAt=now;}
  }
  reset():void {this.state='closed';this.failures=0;this.successes=0;this.openedAt=0;this.probeInFlight=false;}
  snapshot():{state:CircuitState;failures:number;openedAt:number}{return {state:this.state,failures:this.failures,openedAt:this.openedAt};}
}
