import { normalizeForMatching } from '../../text/normalize-base.ts';
import type { Language } from '../../types.ts';
import type { ChatIntent } from '../types.ts';

export interface ClarificationOption { id: string; label: string; synonyms: string[]; }
export interface ClarificationPrompt { id: string; intent: ChatIntent; language: 'en' | 'fr' | 'es'; question: string; options: ClarificationOption[]; allowFreeText: boolean; }
export interface ClarificationResolution { status: 'selected' | 'ambiguous' | 'unmatched'; optionId?: string; matchedLabel?: string; candidates: string[]; }

type CatalogEntry = Omit<ClarificationPrompt, 'language'>;
const CATALOG: Record<'en' | 'fr' | 'es', Record<string, CatalogEntry>> = {
  en: {
    configure_stimulation: { id: 'configure-topic', intent: 'configure_stimulation', question: 'Which setting would you like help with?', allowFreeText: true, options: [
      option('visual', 'Visual movement', ['visual', 'movement', 'dot', 'ball']), option('audio', 'Audio', ['audio', 'sound', 'tones']), option('speed', 'Speed', ['speed', 'pace', 'faster', 'slower']), option('duration', 'Duration', ['duration', 'time', 'length']), option('volume', 'Volume', ['volume', 'loudness']),
    ] },
    wellbeing: { id: 'wellbeing-choice', intent: 'share_feelings', question: 'What kind of support would feel most useful right now?', allowFreeText: true, options: [
      option('grounding', 'Grounding', ['grounding', 'present', 'senses']), option('breathing', 'Breathing', ['breathing', 'breath']), option('listen', 'Talk it through', ['talk', 'listen', 'share']), option('professional', 'Professional support information', ['professional', 'therapist', 'clinician']),
    ] },
    app_help: { id: 'app-help-topic', intent: 'app_help', question: 'Which part of the app do you need help with?', allowFreeText: true, options: [
      option('session_controls', 'Session controls', ['session', 'pause', 'stop']), option('settings', 'Settings', ['settings', 'preferences']), option('privacy', 'Privacy', ['privacy', 'data', 'history']), option('features', 'Features', ['features', 'what can it do']),
    ] },
  },
  fr: {
    configure_stimulation: { id: 'configure-topic', intent: 'configure_stimulation', question: 'Quel réglage souhaitez-vous ajuster ?', allowFreeText: true, options: [
      option('visual', 'Mouvement visuel', ['visuel', 'mouvement', 'point']), option('audio', 'Audio', ['audio', 'son']), option('speed', 'Vitesse', ['vitesse', 'plus vite', 'plus lent']), option('duration', 'Durée', ['durée', 'temps']), option('volume', 'Volume', ['volume', 'sonore']),
    ] },
    wellbeing: { id: 'wellbeing-choice', intent: 'share_feelings', question: 'Quel type de soutien vous serait utile maintenant ?', allowFreeText: true, options: [
      option('grounding', 'Ancrage', ['ancrage', 'présent', 'sens']), option('breathing', 'Respiration', ['respiration', 'souffle']), option('listen', 'En parler', ['parler', 'écouter', 'partager']), option('professional', 'Informations sur un professionnel', ['professionnel', 'thérapeute', 'clinicien']),
    ] },
    app_help: { id: 'app-help-topic', intent: 'app_help', question: 'Quelle partie de l’application vous pose question ?', allowFreeText: true, options: [
      option('session_controls', 'Commandes de séance', ['séance', 'pause', 'arrêt']), option('settings', 'Réglages', ['réglages', 'préférences']), option('privacy', 'Confidentialité', ['confidentialité', 'données', 'historique']), option('features', 'Fonctions', ['fonctions', 'fonctionnalités']),
    ] },
  },
  es: {
    configure_stimulation: { id: 'configure-topic', intent: 'configure_stimulation', question: '¿Qué ajuste quieres consultar?', allowFreeText: true, options: [
      option('visual', 'Movimiento visual', ['visual', 'movimiento', 'punto']), option('audio', 'Audio', ['audio', 'sonido']), option('speed', 'Velocidad', ['velocidad', 'más rápido', 'más lento']), option('duration', 'Duración', ['duración', 'tiempo']), option('volume', 'Volumen', ['volumen', 'sonido']),
    ] },
    wellbeing: { id: 'wellbeing-choice', intent: 'share_feelings', question: '¿Qué tipo de apoyo te resultaría más útil ahora?', allowFreeText: true, options: [
      option('grounding', 'Conexión con el presente', ['presente', 'anclaje', 'sentidos']), option('breathing', 'Respiración', ['respirar', 'respiración']), option('listen', 'Hablarlo', ['hablar', 'escuchar', 'compartir']), option('professional', 'Información profesional', ['profesional', 'terapeuta', 'clínico']),
    ] },
    app_help: { id: 'app-help-topic', intent: 'app_help', question: '¿Qué parte de la aplicación necesitas conocer?', allowFreeText: true, options: [
      option('session_controls', 'Controles de sesión', ['sesión', 'pausa', 'parada']), option('settings', 'Ajustes', ['ajustes', 'preferencias']), option('privacy', 'Privacidad', ['privacidad', 'datos', 'historial']), option('features', 'Funciones', ['funciones', 'características']),
    ] },
  },
};

export function buildClarificationPrompt(intent: ChatIntent, language: Language = 'unknown'): ClarificationPrompt | undefined {
  const locale = language === 'fr' || language === 'es' ? language : 'en';
  const key = intent === 'configure_stimulation' ? 'configure_stimulation' : intent === 'app_help' ? 'app_help' : ['share_feelings', 'grounding', 'breathing', 'professional_support'].includes(intent) ? 'wellbeing' : undefined;
  const entry = key ? CATALOG[locale][key] : undefined;
  return entry ? { ...entry, language: locale, options: entry.options.map((item) => ({ ...item, synonyms: [...item.synonyms] })) } : undefined;
}

/** Resolves only clearly matching options; ambiguous answers must be asked again, never guessed. */
export function resolveClarificationAnswer(input: string, prompt: ClarificationPrompt): ClarificationResolution {
  const normalized = normalizeForMatching(input).trim();
  if (!normalized) return { status: 'unmatched', candidates: [] };
  const matched = prompt.options.filter((item) => [item.id, item.label, ...item.synonyms].some((candidate) => {
    const value = normalizeForMatching(candidate);
    return normalized === value || normalized.includes(value) || value.includes(normalized) && normalized.length >= 4;
  }));
  const unique = [...new Map(matched.map((item) => [item.id, item])).values()];
  if (unique.length === 1) return { status: 'selected', optionId: unique[0]!.id, matchedLabel: unique[0]!.label, candidates: [unique[0]!.id] };
  if (unique.length > 1) return { status: 'ambiguous', candidates: unique.map((item) => item.id) };
  return { status: 'unmatched', candidates: [] };
}
function option(id: string, label: string, synonyms: string[]): ClarificationOption { return { id, label, synonyms }; }
