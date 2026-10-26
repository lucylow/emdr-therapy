import type { Locale, UserPreferences } from '../types.ts';

export type OnboardingStep='welcome'|'language'|'accessibility'|'privacy'|'features'|'complete';
export type OnboardingState={step:OnboardingStep;locale?:Locale;reducedMotion?:boolean;audioEnabled?:boolean;remoteProcessing?:boolean;completed:boolean;updatedAt:number};
export type OnboardingEvent={type:'start'|'set-locale'|'set-reduced-motion'|'set-audio'|'set-remote-consent'|'next'|'back'|'finish'|'reset';value?:unknown;now?:number};
const ORDER:OnboardingStep[]=['welcome','language','accessibility','privacy','features','complete'];
export function initialOnboardingState(now=Date.now()):OnboardingState{return {step:'welcome',completed:false,updatedAt:now};}
export function reduceOnboarding(state:OnboardingState,event:OnboardingEvent):OnboardingState {
  const now=event.now??Date.now();
  if(event.type==='reset')return initialOnboardingState(now);
  const next={...state,updatedAt:now};
  if(event.type==='set-locale'&&['en','fr','es'].includes(String(event.value)))next.locale=event.value as Locale;
  if(event.type==='set-reduced-motion'&&typeof event.value==='boolean')next.reducedMotion=event.value;
  if(event.type==='set-audio'&&typeof event.value==='boolean')next.audioEnabled=event.value;
  if(event.type==='set-remote-consent'&&typeof event.value==='boolean')next.remoteProcessing=event.value;
  if(event.type==='start'&&state.step==='welcome')next.step='language';
  if(event.type==='next'){
    const index=ORDER.indexOf(state.step); if(index>=0&&index<ORDER.length-1)next.step=ORDER[index+1];
  }
  if(event.type==='back'){
    const index=ORDER.indexOf(state.step); if(index>0)next.step=ORDER[index-1];
  }
  if(event.type==='finish') {next.step='complete';next.completed=true;}
  // Remote consent is intentionally opt-in. Missing values never imply consent.
  return next;
}
export function onboardingPreferences(state:OnboardingState):UserPreferences {
  const out:UserPreferences={}; if(state.locale)out.locale=state.locale;
  if(typeof state.reducedMotion==='boolean')out.reducedMotion=state.reducedMotion;
  if(typeof state.audioEnabled==='boolean')out.audioEnabled=state.audioEnabled;
  return out;
}
export function canEnableRemoteProcessing(state:OnboardingState):boolean{return state.remoteProcessing===true&&state.completed;}
