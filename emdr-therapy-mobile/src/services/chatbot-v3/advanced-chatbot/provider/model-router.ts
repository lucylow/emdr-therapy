import type { ChatModelProvider, ModelRequest, ModelResult, TurnConsent } from '../types.ts';
import { auditModelRequest } from './prompt-builder.ts';
import { CircuitBreaker } from './circuit-breaker.ts';

export type ProviderOutcome={ok:boolean;result?:ModelResult;reason?:string;elapsedMs:number};
export class ModelRouter {
  private readonly circuit:CircuitBreaker;
  constructor(private readonly provider:ChatModelProvider|undefined, private readonly enabled:boolean, private readonly timeoutMs=8000, circuit?:CircuitBreaker){this.circuit=circuit??new CircuitBreaker();}
  async generate(request:ModelRequest, consent:TurnConsent, now=Date.now()):Promise<ProviderOutcome>{
    const audit=auditModelRequest(request,{remoteProcessing:consent.remoteProcessing,sendHistory:consent.sendHistory},this.enabled&&!!this.provider);
    if(!audit.ok)return {ok:false,reason:`policy:${audit.reasons.join(',')}`,elapsedMs:0};
    if(!this.provider)return {ok:false,reason:'provider-unavailable',elapsedMs:0};
    if(!this.circuit.allow(now))return {ok:false,reason:'provider-circuit-open',elapsedMs:0};
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),this.timeoutMs); const started=Date.now();
    try{
      const result=await this.provider.generate(request,controller.signal);
      if(typeof result.text!=='string'||!result.text.trim())throw new Error('empty-provider-result');
      if(result.text.length>12_000)throw new Error('provider-output-too-large');
      this.circuit.success();return {ok:true,result,elapsedMs:Date.now()-started};
    }catch(error){this.circuit.failure();return {ok:false,reason:controller.signal.aborted?'provider-timeout':error instanceof Error?`provider-error:${error.message.slice(0,100)}`:'provider-error',elapsedMs:Date.now()-started};}
    finally{clearTimeout(timer);}
  }
  resetCircuit():void{this.circuit.reset();}
  circuitState(now=Date.now()):string{return this.circuit.getState(now);}
}
