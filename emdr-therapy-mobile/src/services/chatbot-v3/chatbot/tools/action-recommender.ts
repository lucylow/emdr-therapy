import type { ChatAction, ChatIntent, ChatToolId, ToolDescriptor } from '../types.ts';

const TOOL_DESCRIPTORS: ToolDescriptor[] = [
  { id: 'open_grounding', requiresConfirmation: false, available: true, requiresRemoteModel: false },
  { id: 'open_breathing', requiresConfirmation: false, available: true, requiresRemoteModel: false },
  { id: 'open_privacy', requiresConfirmation: false, available: true, requiresRemoteModel: false },
  { id: 'pause_stimulation', requiresConfirmation: false, available: true, requiresRemoteModel: false },
  { id: 'stop_stimulation', requiresConfirmation: false, available: true, requiresRemoteModel: false },
  { id: 'open_settings', requiresConfirmation: true, available: true, requiresRemoteModel: false },
  { id: 'contact_support', requiresConfirmation: true, available: true, requiresRemoteModel: false },
];

export function listChatToolDescriptors(): ToolDescriptor[] {
  return TOOL_DESCRIPTORS.map((tool) => ({ ...tool }));
}

export interface ActionContext {
  intent: ChatIntent;
  safetyOverride?: boolean;
  activeSession?: boolean;
  language?: 'en' | 'fr' | 'es' | 'unknown';
}

/** Returns suggested UI actions only. It intentionally has no execute() method. */
export function recommendChatActions(context: ActionContext): ChatAction[] {
  const locale = context.language === 'fr' || context.language === 'es' ? context.language : 'en';
  const actions: ChatAction[] = [];
  const add = (id: ChatToolId, reason: ChatAction['reason'], confirmation = false) => {
    if (actions.some((action) => action.id === id)) return;
    const labels: Record<'en' | 'fr' | 'es', Record<ChatToolId, string>> = {
      en: { open_grounding: 'Grounding exercise', open_breathing: 'Breathing exercise', open_privacy: 'Privacy settings', pause_stimulation: 'Pause stimulation', stop_stimulation: 'Stop stimulation', open_settings: 'Review settings', contact_support: 'Find human support' },
      fr: { open_grounding: 'Exercice d’ancrage', open_breathing: 'Exercice de respiration', open_privacy: 'Paramètres de confidentialité', pause_stimulation: 'Mettre en pause', stop_stimulation: 'Arrêter la stimulation', open_settings: 'Vérifier les réglages', contact_support: 'Trouver du soutien humain' },
      es: { open_grounding: 'Ejercicio de conexión con el presente', open_breathing: 'Ejercicio de respiración', open_privacy: 'Ajustes de privacidad', pause_stimulation: 'Pausar estimulación', stop_stimulation: 'Detener estimulación', open_settings: 'Revisar ajustes', contact_support: 'Buscar apoyo humano' },
    };
    actions.push({ id, label: labels[locale][id], reason, requiresConfirmation: confirmation });
  };

  if (context.safetyOverride) {
    add('stop_stimulation', 'safety_support');
    add('contact_support', 'safety_support', true);
    return actions;
  }
  switch (context.intent) {
    case 'grounding': add('open_grounding', 'intent_match'); break;
    case 'breathing': add('open_breathing', 'intent_match'); break;
    case 'privacy': add('open_privacy', 'intent_match'); break;
    case 'configure_stimulation': add('open_settings', 'user_request', true); break;
    case 'professional_support': add('contact_support', 'intent_match', true); break;
    case 'pause': add('pause_stimulation', 'user_request'); break;
    case 'stop': add('stop_stimulation', 'user_request'); break;
    case 'share_feelings': add('open_grounding', 'intent_match'); break;
    default: break;
  }
  if (context.activeSession) {
    add('pause_stimulation', 'user_request');
    add('stop_stimulation', 'user_request');
  }
  return actions.slice(0, 4);
}

export function isKnownToolId(value: string): value is ChatToolId {
  return TOOL_DESCRIPTORS.some((item) => item.id === value);
}
