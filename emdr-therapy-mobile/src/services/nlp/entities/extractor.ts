import type { ExtractedEntity, Language } from '../types.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';

const TOPICS: Array<{ value: string; phrases: string[] }> = [
  { value: 'sleep', phrases: ['sleep', 'sleeping', 'insomnia', 'nightmare', 'nightmares', 'sommeil', 'dormir', 'sueño', 'dormir'] },
  { value: 'work', phrases: ['work', 'job', 'workplace', 'career', 'travail', 'travailleur', 'trabajo', 'empleo'] },
  { value: 'relationships', phrases: ['relationship', 'partner', 'family', 'friend', 'conflict', 'famille', 'relation', 'pareja', 'familia', 'amigo'] },
  { value: 'body_sensations', phrases: ['body', 'chest', 'heart racing', 'tense', 'tightness', 'corps', 'poitrine', 'cuerpo', 'pecho'] },
  { value: 'memories', phrases: ['memory', 'memories', 'remember', 'flashback', 'souvenir', 'recuerdo', 'memoria'] },
  { value: 'daily_routine', phrases: ['routine', 'daily life', 'school', 'chores', 'quotidien', 'rutina', 'vida diaria'] },
  { value: 'uncertainty', phrases: ['uncertain', 'not sure', 'confused', 'decision', 'incertain', 'confus', 'inseguro', 'confundido'] },
];

const SENSORY: Array<{ value: string; phrases: string[] }> = [
  { value: 'visual', phrases: ['visual', 'moving dot', 'moving ball', 'eye movement', 'visuel', 'visual'] },
  { value: 'audio', phrases: ['audio', 'sound', 'tone', 'beep', 'son', 'audio'] },
  { value: 'haptic', phrases: ['haptic', 'vibration', 'vibrating', 'vibration'] },
  { value: 'reduced_motion', phrases: ['reduced motion', 'no animation', 'motion makes me dizzy', 'less movement'] },
  { value: 'no_sound', phrases: ['no sound', 'mute', 'silent', 'without audio'] },
];

const SUPPORT: Array<{ value: string; phrases: string[] }> = [
  { value: 'gentle_language', phrases: ['gently', 'softly', 'gentle words', 'slowly please'] },
  { value: 'short_steps', phrases: ['one step at a time', 'short steps', 'keep it brief', 'simple instructions'] },
  { value: 'no_questions', phrases: ['no questions', 'do not ask questions', 'just listen'] },
  { value: 'practical_options', phrases: ['practical options', 'what can i do', 'next step'] },
];

const TIME_PATTERNS: Array<{ regex: RegExp; value: string }> = [
  { regex: /\b(?:right now|now|this moment|maintenant|ahora)\b/u, value: 'now' },
  { regex: /\b(?:today|ce soir|aujourd'hui|hoy)\b/u, value: 'today' },
  { regex: /\b(?:tonight|cette nuit|esta noche)\b/u, value: 'tonight' },
  { regex: /\b(?:tomorrow|demain|mañana)\b/u, value: 'tomorrow' },
];

/** Extracts broad, non-sensitive conversation themes. It does not infer trauma or diagnoses. */
export function extractEntities(text: string, _language: Language): ExtractedEntity[] {
  const normalized = normalizeForMatching(text);
  const results: ExtractedEntity[] = [];
  for (const topic of TOPICS) {
    const phrase = topic.phrases.find((item) => contains(normalized, normalizeForMatching(item)));
    if (phrase) results.push({ type: 'topic', value: topic.value, confidence: 0.72, sourcePhrase: phrase });
  }
  for (const preference of SENSORY) {
    const phrase = preference.phrases.find((item) => contains(normalized, normalizeForMatching(item)));
    if (phrase) results.push({ type: 'sensory_preference', value: preference.value, confidence: 0.84, sourcePhrase: phrase });
  }
  for (const preference of SUPPORT) {
    const phrase = preference.phrases.find((item) => contains(normalized, normalizeForMatching(item)));
    if (phrase) results.push({ type: 'support_preference', value: preference.value, confidence: 0.74, sourcePhrase: phrase });
  }
  for (const time of TIME_PATTERNS) {
    if (time.regex.test(normalized)) results.push({ type: 'time', value: time.value, confidence: 0.9, sourcePhrase: time.value });
  }
  return results.slice(0, 12);
}

function contains(text: string, phrase: string): boolean {
  return Boolean(phrase) && (` ${text} `).includes(` ${phrase} `);
}
