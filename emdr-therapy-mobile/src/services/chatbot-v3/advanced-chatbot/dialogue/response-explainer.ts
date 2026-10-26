import type { ChatResponse, IntentCandidate, Locale, Source } from '../types.ts';
export type ResponseExplanation={intent:string;score:number;signals:string[];sourceIds:string[];mode:string;remoteUsed:boolean};
export function explainResponse(response:ChatResponse,candidate:IntentCandidate,sources:Source[],remoteUsed=false):ResponseExplanation {
  return {intent:candidate.intent,score:Number(candidate.score.toFixed(3)),signals:candidate.evidence.slice(0,5),sourceIds:sources.map(s=>s.id).slice(0,5),mode:response.mode,remoteUsed};
}
export function explanationText(candidate:IntentCandidate,locale:Locale):string {
  if(candidate.intent==='unknown'||candidate.score<0.35){return ({en:'I used a clarification response because I could not identify a clear request.',fr:'J’ai demandé une précision car votre demande n’était pas claire.',es:'Pedí una aclaración porque no pude identificar una solicitud clara.'})[locale];}
  return ({en:`I selected the ${candidate.intent.replace(/_/g,' ')} route using local text cues.`,fr:`J’ai choisi la catégorie ${candidate.intent.replace(/_/g,' ')} à partir d’indices textuels locaux.`,es:`Elegí la ruta ${candidate.intent.replace(/_/g,' ')} usando señales de texto locales.`})[locale];
}
