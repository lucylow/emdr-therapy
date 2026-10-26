export type FeatureName='remote-chat-model'|'conversation-history'|'reflection-themes'|'personalized-shortcuts'|'speech-input'|'aggregate-feedback';
export type FeatureGate={feature:FeatureName;enabled:boolean;rolloutPercent:number;requiresConsent:boolean;owner:'user'|'product';};
const DEFAULTS:Record<FeatureName,FeatureGate>={
 'remote-chat-model':{feature:'remote-chat-model',enabled:false,rolloutPercent:0,requiresConsent:true,owner:'user'},
 'conversation-history':{feature:'conversation-history',enabled:false,rolloutPercent:0,requiresConsent:true,owner:'user'},
 'reflection-themes':{feature:'reflection-themes',enabled:true,rolloutPercent:100,requiresConsent:true,owner:'user'},
 'personalized-shortcuts':{feature:'personalized-shortcuts',enabled:true,rolloutPercent:100,requiresConsent:true,owner:'user'},
 'speech-input':{feature:'speech-input',enabled:false,rolloutPercent:0,requiresConsent:true,owner:'user'},
 'aggregate-feedback':{feature:'aggregate-feedback',enabled:false,rolloutPercent:0,requiresConsent:true,owner:'user'},
};
export function defaultFeatureGates():FeatureGate[]{return Object.values(DEFAULTS).map(g=>({...g}));}
export function featureEnabled(gate:FeatureGate,consent:boolean,stableBucket:number):boolean {
 if(!gate.enabled||gate.rolloutPercent<=0)return false;if(gate.rolloutPercent<100&&(stableBucket<0||stableBucket>=100||stableBucket>=gate.rolloutPercent))return false;
 return !gate.requiresConsent||consent;
}
export function validateGate(gate:FeatureGate):string[]{const errors:string[]=[];if(!Number.isFinite(gate.rolloutPercent)||gate.rolloutPercent<0||gate.rolloutPercent>100)errors.push('invalid-rollout');if(!gate.enabled&&gate.rolloutPercent>0)errors.push('disabled-feature-has-rollout');if(gate.owner!=='user'&&gate.requiresConsent)errors.push('consent-cannot-be-overridden-by-product');return errors;}
