import { classifyIntent } from '../../intent/classifier.ts';
import { DEFAULT_NLP_CONFIG } from '../../config.ts';
import { normalizeChatInput, detectExactChatControl } from '../normalize.ts';
import type { ChatIntent, RouteResult } from '../types.ts';
import type { Intent, Language } from '../../types.ts';

interface OverlayRule { intent: ChatIntent; pattern: RegExp; language: Language; weight: number; cue: string; }

const OVERLAYS: OverlayRule[] = [
  { intent: 'privacy', pattern: /\b(?:privacy|private|delete my data|forget me|data storage|who can see|what do you store|how is my chat used|my conversation data)\b/u, language: 'en', weight: 0.97, cue: 'privacy_explicit' },
  { intent: 'privacy', pattern: /\b(?:confidentialité|données personnelles|supprime mes données|oublie-moi|qui peut voir)\b/u, language: 'fr', weight: 0.97, cue: 'privacy_explicit' },
  { intent: 'privacy', pattern: /\b(?:privacidad|datos personales|borra mis datos|olvídame|quién puede ver)\b/u, language: 'es', weight: 0.97, cue: 'privacy_explicit' },
  { intent: 'explain_emdr', pattern: /\b(?:what is emdr|explain emdr|how does emdr work|eye movement desensitization)\b/u, language: 'en', weight: 0.91, cue: 'emdr_explanation' },
  { intent: 'explain_emdr', pattern: /\b(?:qu'est-ce que l'emdr|expliquez? l'emdr|comment fonctionne l'emdr)\b/u, language: 'fr', weight: 0.91, cue: 'emdr_explanation' },
  { intent: 'explain_emdr', pattern: /\b(?:qué es emdr|explica emdr|cómo funciona emdr)\b/u, language: 'es', weight: 0.91, cue: 'emdr_explanation' },
  { intent: 'app_help', pattern: /\b(?:how do i use|how to use|help me use|where is|app help|help me navigate|feature|settings menu)\b/u, language: 'en', weight: 0.82, cue: 'app_help' },
  { intent: 'app_help', pattern: /\b(?:comment utiliser|aide sur l'application|où se trouve|paramètres)\b/u, language: 'fr', weight: 0.82, cue: 'app_help' },
  { intent: 'app_help', pattern: /\b(?:cómo usar|ayuda de la aplicación|dónde está|ajustes)\b/u, language: 'es', weight: 0.82, cue: 'app_help' },
  { intent: 'professional_support', pattern: /\b(?:find a therapist|talk to a therapist|professional help|licensed therapist|psychologist near)\b/u, language: 'en', weight: 0.86, cue: 'professional_help_request' },
  { intent: 'professional_support', pattern: /\b(?:trouver un thérapeute|parler à un thérapeute|aide professionnelle)\b/u, language: 'fr', weight: 0.86, cue: 'professional_help_request' },
  { intent: 'professional_support', pattern: /\b(?:buscar terapeuta|hablar con un terapeuta|ayuda profesional)\b/u, language: 'es', weight: 0.86, cue: 'professional_help_request' },
  { intent: 'reflection', pattern: /\b(?:help me reflect|reflection prompt|ask me a question|journal prompt|think this through)\b/u, language: 'en', weight: 0.79, cue: 'reflection_request' },
  { intent: 'reflection', pattern: /\b(?:aide-moi à réfléchir|question de réflexion|écrire dans mon journal)\b/u, language: 'fr', weight: 0.79, cue: 'reflection_request' },
  { intent: 'reflection', pattern: /\b(?:ayúdame a reflexionar|pregunta de reflexión|escribir en mi diario)\b/u, language: 'es', weight: 0.79, cue: 'reflection_request' },
  { intent: 'feedback', pattern: /\b(?:that helped|not helpful|wrong answer|too long|too short|give feedback)\b/u, language: 'en', weight: 0.78, cue: 'feedback' },
];

const BASE_MAP: Partial<Record<Intent, ChatIntent>> = {
  greeting: 'greeting', goodbye: 'goodbye', grounding_request: 'grounding', breathing_request: 'breathing',
  explain_app: 'app_help', configure_stimulation: 'configure_stimulation', pause_request: 'pause', stop_request: 'stop',
  distress_share: 'share_feelings', positive_share: 'share_feelings', reflection_request: 'reflection',
  privacy_question: 'privacy', professional_support_request: 'professional_support', safety_concern: 'safety_support',
  feedback: 'feedback', session_ready: 'app_help', unknown: 'unknown',
};

export class ChatIntentRouter {
  route(input: string, language: Language = 'unknown'): RouteResult {
    const normalized = normalizeChatInput(input, 2400);
    const control = detectExactChatControl(normalized.text);
    if (control !== 'none') {
      return { intent: control, confidence: 0.999, shouldClarify: false, sourceIntent: control === 'stop' ? 'stop_request' : 'pause_request', cues: ['exact_control_command'], directControl: control };
    }
    const base = classifyIntent(normalized.text, DEFAULT_NLP_CONFIG, language);
    const overlays = OVERLAYS.filter((rule) => rule.pattern.test(normalized.normalized) && (language === 'unknown' || language === rule.language))
      .sort((a, b) => b.weight - a.weight);
    const winner = overlays[0];
    if (winner && winner.weight >= 0.76) {
      return { intent: winner.intent, confidence: winner.weight, shouldClarify: false, sourceIntent: base.intent, cues: [winner.cue], directControl: 'none' };
    }
    const mapped = BASE_MAP[base.intent] ?? 'unknown';
    const confidence = Math.max(0, Math.min(0.99, base.confidence));
    const unclear = mapped === 'unknown' || base.shouldClarify || confidence < 0.49 || base.margin < 0.045;
    return {
      intent: unclear ? 'unknown' : mapped,
      confidence,
      shouldClarify: unclear,
      sourceIntent: base.intent,
      cues: base.alternatives.slice(0, 2).map((row) => `${row.intent}:${row.score.toFixed(2)}`),
      directControl: 'none',
    };
  }
}

export function routeIntent(input: string, language: Language = 'unknown'): RouteResult {
  return new ChatIntentRouter().route(input, language);
}
