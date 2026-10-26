import type { Intent, Language, SuggestedAction } from '../types.ts';
import { getTemplate } from './templates.ts';

export interface Plan { text: string; actions: SuggestedAction[]; shouldClarify: boolean; }

export function planResponse(intent: Intent, language: Language, shouldClarify: boolean): Plan {
  const labels = actionLabels(language);
  const actionsByIntent: Partial<Record<Intent, SuggestedAction[]>> = {
    grounding_request: [{ id: 'grounding', label: labels.grounding, priority: 1 }, { id: 'pause', label: labels.pause, priority: 2 }],
    breathing_request: [{ id: 'breathing', label: labels.breathing, priority: 1 }, { id: 'pause', label: labels.pause, priority: 2 }],
    configure_stimulation: [{ id: 'pause', label: labels.pause, priority: 1 }, { id: 'stop', label: labels.stop, priority: 2 }],
    session_ready: [{ id: 'pause', label: labels.pause, priority: 1 }, { id: 'stop', label: labels.stop, priority: 2 }],
    pause_request: [{ id: 'pause', label: labels.pause, priority: 1 }, { id: 'stop', label: labels.stop, priority: 2 }],
    stop_request: [{ id: 'stop', label: labels.stop, priority: 1 }],
    distress_share: [{ id: 'pause', label: labels.pause, priority: 1 }, { id: 'grounding', label: labels.grounding, priority: 2 }, { id: 'stop', label: labels.stop, priority: 3 }],
    privacy_question: [{ id: 'privacy_info', label: labels.privacy, priority: 1 }],
    professional_support_request: [{ id: 'contact_support', label: labels.support, priority: 1 }],
  };
  let text = getTemplate(intent, language);
  const actions = actionsByIntent[intent] ?? [];
  if (shouldClarify && intent === 'unknown') {
    text = getTemplate('unknown', language);
    actions.push({ id: 'clarify', label: labels.clarify, priority: 10 });
  }
  return { text, actions: actions.sort((a, b) => a.priority - b.priority), shouldClarify };
}

function actionLabels(language: Language): Record<'grounding' | 'breathing' | 'pause' | 'stop' | 'privacy' | 'support' | 'clarify', string> {
  if (language === 'fr') return { grounding: 'Ancrage', breathing: 'Respiration', pause: 'Pause', stop: 'Arrêter', privacy: 'Confidentialité', support: 'Soutien professionnel', clarify: 'Préciser' };
  if (language === 'es') return { grounding: 'Orientación al presente', breathing: 'Respiración', pause: 'Pausa', stop: 'Detener', privacy: 'Privacidad', support: 'Apoyo profesional', clarify: 'Aclarar' };
  return { grounding: 'Grounding', breathing: 'Breathing', pause: 'Pause', stop: 'Stop', privacy: 'Privacy', support: 'Professional support', clarify: 'Clarify' };
}
