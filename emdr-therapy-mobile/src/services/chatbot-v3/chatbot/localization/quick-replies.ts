import type { ChatIntent } from '../types.ts';
import type { Language } from '../../types.ts';

export interface QuickReply { id: string; label: string; intent: ChatIntent; }

const COPY: Record<'en' | 'fr' | 'es', QuickReply[]> = {
  en: [
    { id: 'grounding', label: 'Grounding exercise', intent: 'grounding' },
    { id: 'breathing', label: 'Breathing prompt', intent: 'breathing' },
    { id: 'app-help', label: 'Help with the app', intent: 'app_help' },
    { id: 'privacy', label: 'Privacy and data', intent: 'privacy' },
    { id: 'emdr-info', label: 'What is EMDR?', intent: 'explain_emdr' },
    { id: 'professional-support', label: 'Find professional support', intent: 'professional_support' },
  ],
  fr: [
    { id: 'grounding', label: 'Exercice d’ancrage', intent: 'grounding' },
    { id: 'breathing', label: 'Suggestion de respiration', intent: 'breathing' },
    { id: 'app-help', label: 'Aide avec l’application', intent: 'app_help' },
    { id: 'privacy', label: 'Confidentialité et données', intent: 'privacy' },
    { id: 'emdr-info', label: 'Qu’est-ce que l’EMDR ?', intent: 'explain_emdr' },
    { id: 'professional-support', label: 'Trouver un professionnel', intent: 'professional_support' },
  ],
  es: [
    { id: 'grounding', label: 'Conexión con el presente', intent: 'grounding' },
    { id: 'breathing', label: 'Ejercicio de respiración', intent: 'breathing' },
    { id: 'app-help', label: 'Ayuda con la aplicación', intent: 'app_help' },
    { id: 'privacy', label: 'Privacidad y datos', intent: 'privacy' },
    { id: 'emdr-info', label: '¿Qué es EMDR?', intent: 'explain_emdr' },
    { id: 'professional-support', label: 'Buscar apoyo profesional', intent: 'professional_support' },
  ],
};

export function getQuickReplies(language: Language, allowSafetyShortcuts = true): QuickReply[] {
  const locale = language === 'fr' || language === 'es' ? language : 'en';
  const items = COPY[locale].map((item) => ({ ...item }));
  // Emergency controls should be provided by persistent app UI, not hidden in a rotating reply list.
  return allowSafetyShortcuts ? items : items.filter((item) => item.intent !== 'professional_support');
}

export function getQuickReplyById(id: string, language: Language): QuickReply | undefined {
  return getQuickReplies(language).find((item) => item.id === id);
}
