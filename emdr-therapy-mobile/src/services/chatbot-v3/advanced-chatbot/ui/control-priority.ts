import type { Intent, Locale } from '../types.ts';
import { classifyPrimaryIntent } from '../intent-engine.ts';
export type UiCommandPriority='emergency-stop'|'pause'|'resume'|'chat';
export type ControlRoute={priority:UiCommandPriority;intent:Intent;dispatchTo:'native-control'|'chatbot';sendToModel:false};
/** The host should run this check before chatbot generation or network work. */
export function routeUiControlFirst(text:string,locale:Locale):ControlRoute {
 const candidate=classifyPrimaryIntent(text,locale);const intent=candidate.intent;
 if(intent==='stop')return {priority:'emergency-stop',intent,dispatchTo:'native-control',sendToModel:false};
 if(intent==='pause')return {priority:'pause',intent,dispatchTo:'native-control',sendToModel:false};
 if(intent==='resume')return {priority:'resume',intent,dispatchTo:'native-control',sendToModel:false};
 return {priority:'chat',intent,dispatchTo:'chatbot',sendToModel:false};
}
export function controlRouteMustBypassProvider(route:ControlRoute):boolean{return route.dispatchTo==='native-control'&&route.sendToModel===false;}
