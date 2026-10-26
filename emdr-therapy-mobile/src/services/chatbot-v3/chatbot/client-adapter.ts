import type { ChatAction, ChatTurnResult } from './types.ts';

export interface ChatBubbleViewModel {
  id: string;
  role: 'assistant';
  text: string;
  actions: ChatAction[];
  status: 'complete';
  accessibilityLabel: string;
  disclaimer?: string;
}

/** Maps a response into renderable UI state; does not execute actions or write to device storage. */
export function toAssistantBubble(response: ChatTurnResult, options: { showDisclaimer?: boolean } = {}): ChatBubbleViewModel {
  const safeId = response.requestId ? response.requestId.slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_') : `turn-${response.metadata.turnNumber}`;
  const prefix = response.language === 'fr' ? 'Réponse de l’assistant' : response.language === 'es' ? 'Respuesta del asistente' : 'Assistant response';
  return {
    id: safeId,
    role: 'assistant',
    text: response.text,
    actions: response.actions.map((action) => ({ ...action, payload: action.payload ? { ...action.payload } : undefined })),
    status: 'complete',
    accessibilityLabel: `${prefix}. ${response.text}`,
    disclaimer: options.showDisclaimer ? nonClinicalDisclaimer(response.language) : undefined,
  };
}

function nonClinicalDisclaimer(language: ChatTurnResult['language']): string {
  if (language === 'fr') return 'Outil de bien-être général, sans diagnostic ni remplacement d’un professionnel.';
  if (language === 'es') return 'Herramienta general de bienestar; no diagnostica ni sustituye a un profesional.';
  return 'General wellbeing support only; not a diagnosis or substitute for professional care.';
}
