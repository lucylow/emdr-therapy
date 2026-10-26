export type DataArea='ephemeral-session'|'confirmed-preferences'|'aggregate-analytics'|'export-file'|'provider-cache';
export type UserDataControlState={available:DataArea[];retained:DataArea[];remoteProcessingEnabled:boolean;analyticsEnabled:boolean;personalizationEnabled:boolean};
export interface ClearableStore {clear():void;}
/** Explicit privacy control coordinator for stores already held by the host; it does not delete remote account data. */
export class UserDataController {
 private stores=new Map<DataArea,ClearableStore>();private flags={remoteProcessingEnabled:false,analyticsEnabled:false,personalizationEnabled:false};
 register(area:DataArea,store:ClearableStore):void{this.stores.set(area,store);}
 setFlags(patch:Partial<typeof this.flags>):void{this.flags={...this.flags,...patch};}
 state():UserDataControlState{return{available:[...this.stores.keys()],retained:[...this.stores.keys()],...this.flags};}
 clear(area:DataArea):boolean{const store=this.stores.get(area);if(!store)return false;store.clear();if(area==='provider-cache')this.flags.remoteProcessingEnabled=false;if(area==='confirmed-preferences')this.flags.personalizationEnabled=false;return true;}
 clearAllLocal():{cleared:DataArea[];unavailable:DataArea[]}{const cleared:DataArea[]=[],unavailable:DataArea[]=[];for(const area of ['ephemeral-session','confirmed-preferences','aggregate-analytics','provider-cache'] as DataArea[]){const store=this.stores.get(area);if(store){store.clear();cleared.push(area);}else unavailable.push(area);}this.flags={remoteProcessingEnabled:false,analyticsEnabled:false,personalizationEnabled:false};return{cleared,unavailable};}
 disableOptionalProcessing():void{this.flags.remoteProcessingEnabled=false;this.flags.analyticsEnabled=false;this.flags.personalizationEnabled=false;}
}
