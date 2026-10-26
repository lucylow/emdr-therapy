import type { Locale, RiskSignal } from '../types.ts';
import { normalizeText } from '../text.ts';

const PHRASES: Record<Locale, Record<Exclude<RiskSignal,'none'>, string[]>> = {
  en: {
    immediate_danger_language:['in immediate danger','someone is hurting me right now','i am not safe right now','i am being attacked'],
    self_harm_language:['i might hurt myself','i want to kill myself','i am going to end my life','i plan to hurt myself'],
    urgent_support_request:['need urgent help','please get me help now','i cannot keep myself safe'],
  },
  fr: {
    immediate_danger_language:['en danger immédiat','je ne suis pas en sécurité maintenant','on me fait du mal maintenant'],
    self_harm_language:['je pourrais me faire du mal','je veux me suicider','je vais mettre fin à mes jours'],
    urgent_support_request:['besoin daide urgente','aidez moi immédiatement','je ne peux pas rester en sécurité'],
  },
  es: {
    immediate_danger_language:['en peligro inmediato','no estoy a salvo ahora','me están haciendo daño ahora'],
    self_harm_language:['podría hacerme daño','quiero suicidarme','voy a acabar con mi vida'],
    urgent_support_request:['necesito ayuda urgente','ayúdame ahora','no puedo mantenerme a salvo'],
  },
};
const PRIORITY: Record<RiskSignal, number> = { none:0, urgent_support_request:1, self_harm_language:2, immediate_danger_language:3 };
/** Conservative phrase routing, not a clinical risk assessment. False negatives and positives are possible. */
export function detectSafetySignal(text:string, locale:Locale='en'):RiskSignal {
  const value=normalizeText(text);
  const groups=PHRASES[locale] ?? PHRASES.en;
  let best:RiskSignal='none';
  for (const signal of Object.keys(groups) as Array<Exclude<RiskSignal,'none'>>) {
    if (groups[signal].some(phrase=>value.includes(normalizeText(phrase))) && PRIORITY[signal]>PRIORITY[best]) best=signal;
  }
  return best;
}
export function safetyResponse(signal:RiskSignal, locale:Locale='en'):string|undefined {
  if (signal==='none') return undefined;
  const messages:Record<Locale,string> = {
    en:'I’m sorry this feels urgent. I can’t assess emergencies or provide crisis care. Please stop using the app and contact local emergency services if there is immediate danger, or reach a trusted person who can stay with you. Use crisis support available in your location. This chatbot is not monitored by emergency responders.',
    fr:'Je suis désolé que la situation soit urgente. Je ne peux pas évaluer les urgences ni fournir des soins de crise. Arrêtez d’utiliser l’application et contactez les services d’urgence locaux en cas de danger immédiat, ou une personne de confiance qui peut rester avec vous. Utilisez les ressources de crise disponibles dans votre région. Ce chatbot n’est pas surveillé par des intervenants d’urgence.',
    es:'Siento que esto sea urgente. No puedo evaluar emergencias ni ofrecer atención de crisis. Deja de usar la aplicación y contacta con los servicios de emergencia locales si hay peligro inmediato, o con una persona de confianza que pueda acompañarte. Utiliza los recursos de crisis disponibles en tu zona. Este chatbot no está supervisado por personal de emergencias.',
  };
  return messages[locale] ?? messages.en;
}
export function containsMedicalDiagnosisRequest(text:string):boolean {
  const s=normalizeText(text);
  return [
    /\bdo i have (ptsd|depression|anxiety|bipolar|a disorder)\b/u,
    /\bdiagnose me\b/u, /\bwhat disorder do i have\b/u,
    /\bsuis je atteint de (ptsd|dépression|anxiété)\b/u,
    /\bdiagnostícame\b/u, /\bqué trastorno tengo\b/u,
  ].some(p=>p.test(s));
}
export function medicalBoundary(locale:Locale):string {
  const messages:Record<Locale,string>={
    en:'I can share general information, but I can’t diagnose or determine what condition you may have. A qualified health professional can help assess your situation. I can also explain app features or offer an optional grounding exercise.',
    fr:'Je peux partager des informations générales, mais je ne peux pas poser de diagnostic ni déterminer un trouble. Un professionnel de santé qualifié peut évaluer votre situation. Je peux aussi expliquer les fonctions de l’application ou proposer un exercice facultatif d’ancrage.',
    es:'Puedo compartir información general, pero no puedo diagnosticar ni determinar qué trastorno podrías tener. Un profesional de salud cualificado puede evaluar tu situación. También puedo explicar funciones de la aplicación u ofrecer un ejercicio opcional para conectar con el presente.',
  }; return messages[locale] ?? messages.en;
}
