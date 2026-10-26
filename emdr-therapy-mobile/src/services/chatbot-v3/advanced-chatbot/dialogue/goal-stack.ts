export type GoalId='learn-app'|'understand-emdr'|'adjust-settings'|'grounding'|'breathing'|'privacy-control'|'send-feedback';
export type GoalStatus='proposed'|'confirmed'|'active'|'complete'|'cancelled';
export type Goal={id:GoalId;status:GoalStatus;createdAt:number;updatedAt:number;dependsOn?:GoalId;confirmationRequired:boolean};
const KNOWN=new Set<GoalId>(['learn-app','understand-emdr','adjust-settings','grounding','breathing','privacy-control','send-feedback']);
/** A bounded goal plan stores enumerated goal IDs only, not free-text goals. */
export class GoalStack {
 private goals:Goal[]=[];
 constructor(private opts:{maxGoals?:number;ttlMs?:number}={}){}
 propose(id:string,now=Date.now(),dependsOn?:string):Goal|undefined{if(!KNOWN.has(id as GoalId)||dependsOn&&!KNOWN.has(dependsOn as GoalId))return undefined;this.prune(now);if(this.goals.some(g=>g.id===id&&g.status!=='cancelled'&&g.status!=='complete'))return this.get(id as GoalId);const max=this.opts.maxGoals??5;if(this.goals.length>=max){const removable=this.goals.findIndex(g=>g.status==='complete'||g.status==='cancelled');if(removable>=0)this.goals.splice(removable,1);else return undefined;}const g:Goal={id:id as GoalId,status:'proposed',createdAt:now,updatedAt:now,dependsOn:dependsOn as GoalId|undefined,confirmationRequired:true};this.goals.push(g);return{...g};}
 confirm(id:GoalId,now=Date.now()):Goal|undefined{const g=this.goals.find(x=>x.id===id&&x.status==='proposed');if(!g)return undefined;g.status='confirmed';g.updatedAt=now;return{...g};}
 activate(id:GoalId,now=Date.now()):Goal|undefined{const g=this.goals.find(x=>x.id===id&&['confirmed','proposed'].includes(x.status));if(!g||g.status==='proposed'&&g.confirmationRequired)return undefined;if(g.dependsOn){const d=this.goals.find(x=>x.id===g.dependsOn);if(!d||d.status!=='complete')return undefined;}g.status='active';g.updatedAt=now;return{...g};}
 complete(id:GoalId,now=Date.now()):Goal|undefined{const g=this.goals.find(x=>x.id===id&&x.status==='active');if(!g)return undefined;g.status='complete';g.updatedAt=now;return{...g};}
 cancel(id:GoalId,now=Date.now()):boolean{const g=this.goals.find(x=>x.id===id&&['proposed','confirmed','active'].includes(x.status));if(!g)return false;g.status='cancelled';g.updatedAt=now;return true;}
 get(id:GoalId):Goal|undefined{const g=this.goals.find(x=>x.id===id);return g?{...g}:undefined;}
 list():Goal[]{return this.goals.map(g=>({...g}));}
 next():Goal|undefined{const g=this.goals.find(x=>['confirmed','active'].includes(x.status));return g?{...g}:undefined;}
 clear():void{this.goals=[];}
 prune(now=Date.now()):number{const before=this.goals.length;this.goals=this.goals.filter(g=>now-g.updatedAt<=(this.opts.ttlMs??60*60_000));return before-this.goals.length;}
}
