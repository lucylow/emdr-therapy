export type SuggestionKind='grounding'|'breathing'|'privacy'|'feedback'|'session-setup'|'app-help';
export type SuggestionEvent={kind:SuggestionKind;at:number;accepted:boolean};
export class SuggestionThrottle {
 private events:SuggestionEvent[]=[];
 constructor(private opts:{perKindCooldownMs?:number;maxPerHour?:number;minGapMs?:number}={}){}
 allow(kind:SuggestionKind,now=Date.now()):{allowed:boolean;reason:'allowed'|'kind-cooldown'|'hourly-limit'|'minimum-gap'}{this.prune(now);const last=this.events.at(-1);if(last&&now-last.at<(this.opts.minGapMs??60_000))return{allowed:false,reason:'minimum-gap'};const same=this.events.filter(e=>e.kind===kind).at(-1);if(same&&now-same.at<(this.opts.perKindCooldownMs??30*60_000))return{allowed:false,reason:'kind-cooldown'};if(this.events.length>=(this.opts.maxPerHour??5))return{allowed:false,reason:'hourly-limit'};return{allowed:true,reason:'allowed'};}
 record(kind:SuggestionKind,accepted:boolean,now=Date.now()):void{this.prune(now);this.events.push({kind,accepted,at:now});}
 prune(now=Date.now()):number{const before=this.events.length;this.events=this.events.filter(e=>now-e.at<60*60_000);return before-this.events.length;}
 clear():void{this.events=[];}
}
