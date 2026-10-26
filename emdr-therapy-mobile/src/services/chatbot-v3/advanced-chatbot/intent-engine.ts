import type { Intent, IntentCandidate, Locale } from './types.ts';
import { normalizeText, tokenize } from './text.ts';
import { isIntentNegated } from './intent/negation.ts';

const LEXICON: Record<Locale, Partial<Record<Intent, string[]>>> = {
  en: {
    app_help: ['how does this app work', 'help using the app', 'where are settings', 'how do i use this', 'what can you do'],
    emdr_definition: ['what is emdr', 'explain emdr', 'what does emdr mean', 'how does emdr therapy work'],
    grounding: ['grounding exercise', 'help me feel present', 'five things i can see', 'ground me', 'connect to the present'],
    breathing: ['breathing exercise', 'help me breathe', 'slow breathing', 'breathing guide'],
    session_setup: ['start a session', 'set up a session', 'configure session', 'session settings'],
    adjust_speed: ['slower', 'faster', 'change speed', 'adjust speed', 'movement speed'],
    adjust_duration: ['change duration', 'session length', 'shorter session', 'longer session', 'set duration'],
    adjust_audio: ['turn audio on', 'turn audio off', 'change volume', 'audio settings', 'sound settings'],
    adjust_visual: ['change color', 'change visual', 'visual settings', 'ball size', 'movement color'],
    pause: ['pause', 'pause session', 'stop for a moment', 'take a break'],
    resume: ['resume', 'continue session', 'continue the session', 'start again'],
    stop: ['stop', 'stop now', 'end session', 'emergency stop', 'stop immediately'],
    safety_support: ['i need urgent help', 'i might hurt myself', 'i am in immediate danger', 'i do not feel safe'],
    privacy: ['privacy', 'delete my data', 'forget this chat', 'what do you store', 'data settings'],
    feedback: ['give feedback', 'report a problem', 'that was helpful', 'that was not helpful'],
    greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening'],
    farewell: ['goodbye', 'bye', 'thanks goodbye', 'see you'],
  },
  fr: {
    app_help: ['comment utiliser cette application', 'aide pour utiliser l application', 'où sont les paramètres', 'que peux tu faire'],
    emdr_definition: ['quest ce que emdr', 'explique emdr', 'que signifie emdr'],
    grounding: ['exercice dancrage', 'aide moi à revenir au présent', 'revenir au présent'],
    breathing: ['exercice de respiration', 'aide moi à respirer', 'respiration lente'],
    session_setup: ['démarrer une séance', 'configurer une séance', 'paramètres de séance'],
    adjust_speed: ['plus lentement', 'plus vite', 'changer la vitesse', 'vitesse du mouvement'],
    adjust_duration: ['changer la durée', 'durée de séance', 'séance plus courte', 'séance plus longue'],
    adjust_audio: ['activer le son', 'désactiver le son', 'volume du son'],
    adjust_visual: ['changer la couleur', 'paramètres visuels', 'taille du point'],
    pause: ['pause', 'mettre en pause', 'faire une pause'], resume: ['reprendre', 'continuer la séance'],
    stop: ['arrêter', 'arrêter maintenant', 'terminer la séance', 'arrêt durgence'],
    safety_support: ['jai besoin daide urgente', 'je ne suis pas en sécurité'],
    privacy: ['confidentialité', 'supprimer mes données', 'oublier cette conversation'],
    feedback: ['donner un avis', 'signaler un problème'], greeting: ['bonjour', 'salut', 'coucou'], farewell: ['au revoir', 'merci au revoir'],
  },
  es: {
    app_help: ['cómo usar esta aplicación', 'ayuda para usar la aplicación', 'dónde están los ajustes', 'qué puedes hacer'],
    emdr_definition: ['qué es emdr', 'explica emdr', 'qué significa emdr'],
    grounding: ['ejercicio de conexión a tierra', 'ayúdame a estar presente', 'volver al presente'],
    breathing: ['ejercicio de respiración', 'ayúdame a respirar', 'respiración lenta'],
    session_setup: ['iniciar una sesión', 'configurar una sesión', 'ajustes de sesión'],
    adjust_speed: ['más despacio', 'más rápido', 'cambiar velocidad', 'velocidad del movimiento'],
    adjust_duration: ['cambiar duración', 'duración de sesión', 'sesión más corta', 'sesión más larga'],
    adjust_audio: ['activar audio', 'desactivar audio', 'cambiar volumen'],
    adjust_visual: ['cambiar color', 'ajustes visuales', 'tamaño del punto'],
    pause: ['pausa', 'pausar sesión', 'tomar un descanso'], resume: ['reanudar', 'continuar sesión'],
    stop: ['detener', 'detener ahora', 'terminar sesión', 'parada de emergencia'],
    safety_support: ['necesito ayuda urgente', 'no estoy a salvo'],
    privacy: ['privacidad', 'eliminar mis datos', 'olvida esta conversación'],
    feedback: ['dar comentarios', 'informar de un problema'], greeting: ['hola', 'buenos días', 'buenas tardes'], farewell: ['adiós', 'hasta luego'],
  },
};

const WORD_CUES: Record<Locale, Partial<Record<Intent, string[]>>> = {
  en: { pause:['pause','break'], resume:['resume','continue'], stop:['stop','end'], grounding:['grounding','present'], breathing:['breathe','breathing'], privacy:['privacy','delete','forget'], safety_support:['urgent help','not safe','hurt myself','danger'], adjust_speed:['speed','slower','faster'], adjust_duration:['duration','minutes','shorter','longer'], adjust_audio:['audio','volume','sound'], adjust_visual:['color','visual','size'], app_help:['help','settings','app'], emdr_definition:['emdr'], greeting:['hello','hi','hey'], farewell:['bye','goodbye'], feedback:['feedback','problem'] },
  fr: { pause:['pause'], resume:['reprendre','continuer'], stop:['arrêter','terminer'], grounding:['présent','ancrage'], breathing:['respiration','respirer'], privacy:['confidentialité','supprimer'], safety_support:['aide urgente','pas en sécurité'], adjust_speed:['vitesse','lentement','vite'], adjust_duration:['durée','minutes'], adjust_audio:['son','volume'], adjust_visual:['couleur','visuel','taille'], app_help:['aide','paramètres'], emdr_definition:['emdr'], greeting:['bonjour','salut'], farewell:['au revoir'], feedback:['avis','problème'] },
  es: { pause:['pausa','pausar'], resume:['reanudar','continuar'], stop:['detener','terminar'], grounding:['presente','conexión a tierra'], breathing:['respirar','respiración'], privacy:['privacidad','eliminar'], safety_support:['ayuda urgente','no estoy a salvo'], adjust_speed:['velocidad','despacio','rápido'], adjust_duration:['duración','minutos'], adjust_audio:['audio','volumen'], adjust_visual:['color','visual','tamaño'], app_help:['ayuda','ajustes'], emdr_definition:['emdr'], greeting:['hola'], farewell:['adiós'], feedback:['comentarios','problema'] },
};

export function classifyIntents(text: string, locale: Locale = 'en'): IntentCandidate[] {
  const normalized = normalizeText(text);
  if (!normalized) return [{ intent: 'unknown', score: 0, evidence: [] }];
  const tokens = tokenize(normalized);
  const candidates: IntentCandidate[] = [];
  for (const [intent, phrases] of Object.entries(LEXICON[locale]) as Array<[Intent, string[]]>) {
    let score = 0;
    const evidence: string[] = [];
    for (const phrase of phrases) {
      const p = normalizeText(phrase);
      if (normalized === p) { score = Math.max(score, 1); evidence.push(`exact:${phrase}`); }
      else if (normalized.includes(p)) { score = Math.max(score, Math.min(0.97, 0.72 + p.length / Math.max(normalized.length, p.length) * 0.2)); evidence.push(`phrase:${phrase}`); }
    }
    for (const cue of WORD_CUES[locale][intent] ?? []) {
      if (normalized.includes(normalizeText(cue))) { score = Math.max(score, cue.includes(' ') ? 0.82 : 0.52); evidence.push(`cue:${cue}`); }
    }
    if (score > 0) candidates.push({ intent, score: Math.min(score, 1), evidence: [...new Set(evidence)].slice(0, 5) });
  }
  const ranked=candidates.sort((a,b) => b.score-a.score || a.intent.localeCompare(b.intent))
    .filter(candidate => !isIntentNegated(text,candidate.intent,locale)).slice(0,5);
  return ranked.concat(ranked.length ? [] : [{ intent: 'unknown', score: 0.1, evidence: [] }]);
}

export function classifyPrimaryIntent(text: string, locale: Locale = 'en'): IntentCandidate {
  const candidates = classifyIntents(text, locale);
  return candidates[0] ?? { intent: 'unknown', score: 0, evidence: [] };
}

export function isDirectControl(intent: Intent): boolean { return ['pause','resume','stop'].includes(intent); }
