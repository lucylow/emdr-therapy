import type { Language } from '../types.ts';
import { normalizeForMatching } from '../text/normalize-base.ts';

export type PreferenceSlotName =
  | 'audio_enabled'
  | 'visual_enabled'
  | 'speed_level'
  | 'volume_percent'
  | 'duration_minutes'
  | 'visual_size'
  | 'color_preference';

export type PreferenceSlotValue = boolean | number | 'slow' | 'medium' | 'fast' | 'small' | 'medium' | 'large' | string;

export interface PreferenceSlot {
  name: PreferenceSlotName;
  value: PreferenceSlotValue;
  confidence: number;
  evidence: string;
  /** All changes require an explicit UI confirmation before host settings are mutated. */
  requiresConfirmation: true;
}

export interface PreferenceParseResult {
  slots: PreferenceSlot[];
  conflicts: PreferenceSlotName[];
  requiresConfirmation: true;
  note: string;
}

const AUDIO_OFF = /\b(?:mute|muted|silence|silent|no sound|without sound|turn audio off|audio off|sound off|disable audio|cut the sound|couper le son|sans son|desactiver le son|sin sonido|sin audio|apaga el sonido|desactiva el audio)\b/u;
const AUDIO_ON = /\b(?:enable audio|turn audio on|audio on|sound on|with sound|enable sound|activer le son|avec son|activar audio|con sonido)\b/u;
const VISUAL_OFF = /\b(?:no animation|without animation|disable animation|turn visuals off|visuals off|reduce visual stimulation|pas d.animation|sans animation|sin animacion|sin movimiento)\b/u;
const VISUAL_ON = /\b(?:enable animation|turn visuals on|visuals on|animation on|activer l.animation|con animacion|activar animacion)\b/u;
const SPEED_SLOW = /\b(?:slow(?:er|ly)?|reduce the speed|lower the speed|slower pace|ralentis|plus lent|mas lento|despacio)\b/u;
const SPEED_FAST = /\b(?:fast(?:er)?|increase the speed|speed it up|faster pace|plus vite|accelere|mas rapido)\b/u;
const SPEED_MEDIUM = /\b(?:medium speed|normal speed|moderate speed|vitesse normale|velocidad normal)\b/u;
const VOLUME = /\b(?:volume|sound level|loudness|volumen|volume sonore)\s*(?:to|at|of|à|a)?\s*(\d{1,3})\s*(?:%|percent|pour cent|por ciento)?\b/u;
const DURATION = /\b(?:for|duration|lasting|last|pendant|duree|duracion|duración|durante)\s*(\d{1,3})\s*(minutes?|mins?|min|minutes?|minutos?|min)?\b/u;
const DURATION_REVERSE = /\b(\d{1,3})\s*(minutes?|mins?|min|minutes?|minutos?)\b/u;
const SIZE_SMALL = /\b(?:smaller|small(?:er)? dot|small size|reduce the size|plus petit|mas pequeno|mas pequena)\b/u;
const SIZE_LARGE = /\b(?:larger|bigger|large dot|large size|increase the size|plus grand|mas grande)\b/u;
const SIZE_MEDIUM = /\b(?:medium size|default size|normal size|taille normale|tamano normal)\b/u;
const COLOR = /\b(?:color|colour|background|couleur|color de fondo|color del fondo)\s*(?:to|is|:|=|en|de)?\s*(blue|green|teal|purple|lavender|lavande|lavanda|white|black|blue|vert|verte|bleu|bleue|violet|blanc|blanche|azul|verde|morado|blanco|blanca)\b/u;

/**
 * Extracts explicit, low-risk UI preferences from a message. It does not enact
 * settings; callers must present the proposed changes for user confirmation.
 * Critical session controls (pause/stop/start) are intentionally not parsed here.
 */
export function extractPreferenceSlots(text: string, language: Language = 'unknown'): PreferenceParseResult {
  const normalized = normalizeForMatching(String(text ?? '').slice(0, 2000));
  const slots: PreferenceSlot[] = [];
  const add = (name: PreferenceSlotName, value: PreferenceSlotValue, confidence: number, evidence: string) => {
    if (!slots.some((slot) => slot.name === name)) {
      slots.push({ name, value, confidence, evidence: evidence.slice(0, 100), requiresConfirmation: true });
    }
  };

  const audioOff = AUDIO_OFF.test(normalized);
  const audioOn = AUDIO_ON.test(normalized);
  if (audioOff && audioOn) {
    // Conflicting instructions must not be silently resolved by rule order.
  } else if (audioOff) add('audio_enabled', false, 0.92, AUDIO_OFF.exec(normalized)?.[0] ?? 'audio off');
  else if (audioOn) add('audio_enabled', true, 0.91, AUDIO_ON.exec(normalized)?.[0] ?? 'audio on');

  const visualOff = VISUAL_OFF.test(normalized);
  const visualOn = VISUAL_ON.test(normalized);
  if (visualOff && visualOn) {
    // Report the conflict below.
  } else if (visualOff) add('visual_enabled', false, 0.9, VISUAL_OFF.exec(normalized)?.[0] ?? 'visuals off');
  else if (visualOn) add('visual_enabled', true, 0.9, VISUAL_ON.exec(normalized)?.[0] ?? 'visuals on');

  const slow = SPEED_SLOW.test(normalized);
  const fast = SPEED_FAST.test(normalized);
  const medium = SPEED_MEDIUM.test(normalized);
  if (Number(slow) + Number(fast) + Number(medium) === 1) {
    const value = slow ? 'slow' : fast ? 'fast' : 'medium';
    const re = slow ? SPEED_SLOW : fast ? SPEED_FAST : SPEED_MEDIUM;
    add('speed_level', value, 0.86, re.exec(normalized)?.[0] ?? value);
  }

  const volume = VOLUME.exec(normalized);
  if (volume) {
    const value = Number(volume[1]);
    if (value >= 0 && value <= 100) add('volume_percent', value, 0.94, volume[0]);
  }

  const duration = DURATION.exec(normalized) ?? DURATION_REVERSE.exec(normalized);
  if (duration) {
    const value = Number(duration[1]);
    // A parsed preference remains merely a proposal. Never infer session readiness.
    if (value >= 1 && value <= 60) add('duration_minutes', value, 0.9, duration[0]);
  }

  const sizeSmall = SIZE_SMALL.test(normalized);
  const sizeLarge = SIZE_LARGE.test(normalized);
  const sizeMedium = SIZE_MEDIUM.test(normalized);
  if (Number(sizeSmall) + Number(sizeLarge) + Number(sizeMedium) === 1) {
    const value = sizeSmall ? 'small' : sizeLarge ? 'large' : 'medium';
    const re = sizeSmall ? SIZE_SMALL : sizeLarge ? SIZE_LARGE : SIZE_MEDIUM;
    add('visual_size', value, 0.82, re.exec(normalized)?.[0] ?? value);
  }

  const color = COLOR.exec(normalized);
  if (color) add('color_preference', normalizeColor(color[1]), 0.8, color[0]);

  const conflicts: PreferenceSlotName[] = [];
  if (audioOff && audioOn) conflicts.push('audio_enabled');
  if (visualOff && visualOn) conflicts.push('visual_enabled');
  if (Number(slow) + Number(fast) + Number(medium) > 1) conflicts.push('speed_level');
  if (Number(sizeSmall) + Number(sizeLarge) + Number(sizeMedium) > 1) conflicts.push('visual_size');
  if (volume && !(Number(volume[1]) >= 0 && Number(volume[1]) <= 100)) conflicts.push('volume_percent');
  if (duration && !(Number(duration[1]) >= 1 && Number(duration[1]) <= 60)) conflicts.push('duration_minutes');

  const locale = language === 'fr' ? 'Les réglages proposés doivent être confirmés dans l’interface.'
    : language === 'es' ? 'Los ajustes propuestos deben confirmarse en la interfaz.'
    : 'Proposed settings require confirmation in the interface.';
  return { slots, conflicts, requiresConfirmation: true, note: locale };
}

function normalizeColor(value: string): string {
  const colors: Record<string, string> = {
    bleu: 'blue', bleue: 'blue', vert: 'green', verte: 'green', violet: 'purple', blanc: 'white', blanche: 'white',
    azul: 'blue', verde: 'green', morado: 'purple', blanco: 'white', blanca: 'white', teal: 'teal', lavender: 'lavender', lavande: 'lavender', lavanda: 'lavender',
  };
  const normalized = normalizeForMatching(value);
  return colors[normalized] ?? normalized;
}
