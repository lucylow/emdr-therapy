import type { Intent, Language } from '../types.ts';

/** Phrase rules are intentionally transparent. Add examples only after review. */
export interface IntentPhrase { intent: Intent; phrase: string; weight: number; language: Language; }

const EN: Record<Intent, string[]> = {
  greeting: ['hello', 'hi there', 'hey', 'good morning', 'good afternoon', 'good evening'],
  goodbye: ['goodbye', 'bye for now', 'that is all', 'i am done', 'talk later'],
  grounding_request: ['help me ground', 'grounding exercise', 'bring me back to the present', 'i feel detached', 'help me feel present', 'five things i can see', 'i need to calm down'],
  breathing_request: ['help me breathe', 'breathing exercise', 'guide my breathing', 'slow breathing', 'box breathing', 'breathing guidance'],
  explain_app: ['what does this app do', 'how does this work', 'what is emdr', 'explain this app', 'how do i use this'],
  configure_stimulation: ['change the speed', 'make it slower', 'make it faster', 'change the color', 'turn off the sound', 'visual stimulation settings', 'audio settings'],
  session_ready: ['i am ready', 'ready to begin', 'start a session', 'begin session', 'i want to start'],
  pause_request: ['pause', 'please pause', 'pause the session', 'i need a break', 'hold on', 'stop for a moment'],
  stop_request: ['stop', 'stop now', 'end this session', 'stop the session', 'i want to stop', 'turn it off'],
  distress_share: ['i feel overwhelmed', 'i feel anxious', 'this is hard', 'i am scared', 'i feel distressed', 'i feel uncomfortable', 'too much for me'],
  positive_share: ['i feel calmer', 'i feel better', 'i feel okay', 'that helped', 'i feel hopeful', 'i feel more settled'],
  reflection_request: ['help me reflect', 'journal prompt', 'write a reflection', 'what should i write', 'help me put this into words'],
  privacy_question: ['is my data private', 'do you store my data', 'where is my data stored', 'is this sent online', 'privacy settings', 'delete my data'],
  professional_support_request: ['find a therapist', 'talk to a professional', 'i need a therapist', 'professional support', 'help finding care'],
  safety_concern: ['i might hurt myself', 'i want to hurt myself', 'i do not feel safe', 'i may hurt someone'],
  feedback: ['i have feedback', 'this is confusing', 'report a bug', 'something is broken', 'i found an issue'],
  unknown: [],
};

const FR: Partial<Record<Intent, string[]>> = {
  greeting: ['bonjour', 'salut', 'bonsoir'],
  goodbye: ['au revoir', 'à bientôt', 'c est tout'],
  grounding_request: ['aide moi à revenir au présent', 'exercice d ancrage', 'je me sens détaché', 'aide moi à me calmer'],
  breathing_request: ['exercice de respiration', 'aide moi à respirer', 'guide ma respiration', 'respiration lente'],
  explain_app: ['comment fonctionne cette application', 'que fait cette application', 'explique cette application'],
  configure_stimulation: ['ralentis le mouvement', 'plus lentement', 'désactive le son', 'paramètres audio'],
  session_ready: ['je suis prêt', 'je suis prête', 'commencer une séance'],
  pause_request: ['pause', 'mets en pause', 'j ai besoin d une pause'],
  stop_request: ['arrête', 'arrête maintenant', 'arrêter la séance'],
  distress_share: ['je me sens dépassé', 'je me sens anxieux', 'c est difficile', 'je suis effrayé'],
  positive_share: ['je me sens mieux', 'je me sens plus calme', 'cela m a aidé'],
  reflection_request: ['aide moi à réfléchir', 'invite moi à écrire', 'question de réflexion'],
  privacy_question: ['mes données sont elles privées', 'où sont stockées mes données', 'supprimer mes données'],
  professional_support_request: ['trouver un thérapeute', 'parler à un professionnel', 'j ai besoin d aide professionnelle'],
  safety_concern: ['je pourrais me faire du mal', 'je ne me sens pas en sécurité'],
};

const ES: Partial<Record<Intent, string[]>> = {
  greeting: ['hola', 'buenos días', 'buenas tardes'],
  goodbye: ['adiós', 'hasta luego', 'eso es todo'],
  grounding_request: ['ayúdame a volver al presente', 'ejercicio de conexión a tierra', 'necesito calmarme'],
  breathing_request: ['ejercicio de respiración', 'ayúdame a respirar', 'guía mi respiración'],
  explain_app: ['cómo funciona esta aplicación', 'qué hace esta aplicación', 'explica esta aplicación'],
  configure_stimulation: ['más despacio', 'más rápido', 'apaga el sonido', 'ajustes de audio'],
  session_ready: ['estoy listo', 'estoy lista', 'empezar una sesión'],
  pause_request: ['pausa', 'por favor pausa', 'necesito un descanso'],
  stop_request: ['detente', 'para ahora', 'detén la sesión'],
  distress_share: ['me siento abrumado', 'me siento ansioso', 'esto es difícil', 'tengo miedo'],
  positive_share: ['me siento mejor', 'me siento más tranquilo', 'eso ayudó'],
  reflection_request: ['ayúdame a reflexionar', 'pregunta para escribir', 'ayúdame a expresarlo'],
  privacy_question: ['mis datos son privados', 'dónde se guardan mis datos', 'borrar mis datos'],
  professional_support_request: ['encontrar un terapeuta', 'hablar con un profesional', 'necesito apoyo profesional'],
  safety_concern: ['podría hacerme daño', 'no me siento seguro'],
};

export const INTENT_PHRASES: IntentPhrase[] = buildPhrases('en', EN)
  .concat(buildPhrases('fr', FR), buildPhrases('es', ES));

function buildPhrases(language: Language, table: Partial<Record<Intent, string[]>>): IntentPhrase[] {
  const entries: IntentPhrase[] = [];
  for (const [intent, phrases] of Object.entries(table) as Array<[Intent, string[]]>) {
    for (const phrase of phrases) {
      entries.push({ intent, phrase, language, weight: phrase.split(/\s+/u).length > 2 ? 1.15 : 1 });
    }
  }
  return entries;
}

export const INTENTS: Intent[] = Object.keys(EN) as Intent[];
