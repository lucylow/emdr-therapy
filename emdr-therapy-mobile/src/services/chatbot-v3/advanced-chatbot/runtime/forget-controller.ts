export type ForgetScope = 'conversation' | 'preferences' | 'metrics' | 'all-local-data';
export type ForgetAction = { scope: ForgetScope; label: string; deletes: string[]; requiresConfirmation: true };
export type ForgetResult = { completed: ForgetScope[]; failed: ForgetScope[]; errors: string[] };
export type ForgetHandler = () => void | Promise<void>;
const LABELS:Record<ForgetScope,string>={conversation:'Clear this conversation',preferences:'Forget saved preferences',metrics:'Clear local aggregate metrics','all-local-data':'Clear all local chatbot data'};
/** Host-controlled data deletion coordinator. It lists effects up front and reports partial failures honestly. */
export class ForgetController {
 private readonly handlers=new Map<ForgetScope,ForgetHandler>();
 register(scope:ForgetScope,handler:ForgetHandler):void{this.handlers.set(scope,handler);}
 proposal(scope:ForgetScope):ForgetAction {return{scope,label:LABELS[scope],requiresConfirmation:true,deletes:effects[scope].slice()};}
 async execute(scope:ForgetScope,confirmed:boolean):Promise<ForgetResult>{
  if(!confirmed)return{completed:[],failed:[scope],errors:['confirmation-required']};
  const scopes:ForgetScope[]=scope==='all-local-data'?['conversation','preferences','metrics','all-local-data']:[scope];
  const completed:ForgetScope[]=[],failed:ForgetScope[]=[],errors:string[]=[];
  for(const item of scopes){const handler=this.handlers.get(item);if(!handler){if(item==='all-local-data')continue;failed.push(item);errors.push(`${item}:handler-not-registered`);continue;}try{await handler();completed.push(item);}catch(e){failed.push(item);errors.push(`${item}:${e instanceof Error?e.name:'unknown-error'}`);}}
  return{completed,failed,errors};
 }
 registeredScopes():ForgetScope[]{return[...this.handlers.keys()];}
 clearHandlers():void{this.handlers.clear();}
}
const effects:Record<ForgetScope,string[]>={conversation:['in-memory turn context','pending clarification state','session repetition guard'],preferences:['saved low-risk presentation preferences'],metrics:['local count-only metrics buckets'],'all-local-data':['all registered local chatbot data stores; unregistered stores cannot be cleared automatically']};
