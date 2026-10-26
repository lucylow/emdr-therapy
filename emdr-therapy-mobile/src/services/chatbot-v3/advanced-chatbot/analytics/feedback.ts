export type FeedbackLabel='helpful'|'not-helpful'|'wrong-language'|'irrelevant'|'unsafe'|'missing-answer';
export type FeedbackEvent={label:FeedbackLabel;intent:string;mode:string;createdAt:number};
export type FeedbackSummary={count:number;helpfulRate:number|null;byLabel:Record<FeedbackLabel,number>;byIntent:Record<string,number>};
const LABELS:FeedbackLabel[]=['helpful','not-helpful','wrong-language','irrelevant','unsafe','missing-answer'];
export class AggregateFeedback {
  private count=0;private helpful=0;private readonly labels:Record<FeedbackLabel,number>={helpful:0,'not-helpful':0,'wrong-language':0,irrelevant:0,unsafe:0,'missing-answer':0};
  private readonly intents=new Map<string,number>();
  constructor(private readonly enabled=false,private readonly minimumForRate=10,private readonly maxDistinctIntents=100){}
  record(event:FeedbackEvent):boolean {
    if(!this.enabled)return false;
    if(!LABELS.includes(event.label)||!/^[-a-z0-9_]{1,50}$/i.test(event.intent)||!/^[-a-z0-9_]{1,50}$/i.test(event.mode))return false;
    this.count++;this.labels[event.label]++;if(event.label==='helpful')this.helpful++;
    if(!this.intents.has(event.intent)&&this.intents.size>=this.maxDistinctIntents)return true;
    this.intents.set(event.intent,(this.intents.get(event.intent)??0)+1);return true;
  }
  summary():FeedbackSummary {
    return {count:this.count,helpfulRate:this.count>=this.minimumForRate?this.helpful/this.count:null,byLabel:{...this.labels},byIntent:Object.fromEntries(this.intents)};
  }
  reset():void{this.count=0;this.helpful=0;for(const key of LABELS)this.labels[key]=0;this.intents.clear();}
}
