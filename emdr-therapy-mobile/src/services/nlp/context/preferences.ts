export interface InteractionPreferences {
  preferredResponseLength: 'short' | 'standard';
  preferredTone: 'gentle' | 'direct' | 'neutral';
  prefersFewerQuestions: boolean;
  reducedSensoryInput: boolean;
  audioEnabled: boolean;
  reducedMotion: boolean;
}

export const DEFAULT_INTERACTION_PREFERENCES: Readonly<InteractionPreferences> = Object.freeze({
  preferredResponseLength: 'standard',
  preferredTone: 'gentle',
  prefersFewerQuestions: false,
  reducedSensoryInput: false,
  audioEnabled: true,
  reducedMotion: false,
});

/** Parses only explicit UI-adjacent preferences. It never infers clinical needs. */
export function parseInteractionPreferences(text: string): Partial<InteractionPreferences> {
  const normalized = text.toLowerCase();
  const result: Partial<InteractionPreferences> = {};
  if (/\b(keep it short|short answer|briefly|keep it brief)\b/u.test(normalized)) result.preferredResponseLength = 'short';
  if (/\b(explain in detail|more detail|full explanation)\b/u.test(normalized)) result.preferredResponseLength = 'standard';
  if (/\b(be direct|just the steps|straightforward)\b/u.test(normalized)) result.preferredTone = 'direct';
  if (/\b(gently|gentle words|soft tone)\b/u.test(normalized)) result.preferredTone = 'gentle';
  if (/\b(no questions|ask fewer questions|just listen)\b/u.test(normalized)) result.prefersFewerQuestions = true;
  if (/\b(reduced motion|less movement|no animation)\b/u.test(normalized)) result.reducedMotion = true;
  if (/\b(mute|no sound|turn off audio|without sound)\b/u.test(normalized)) result.audioEnabled = false;
  if (/\b(too much stimulation|less stimulation|reduce sensory input)\b/u.test(normalized)) result.reducedSensoryInput = true;
  return result;
}

export function applyPreferencePatch(current: InteractionPreferences, patch: Partial<InteractionPreferences>): InteractionPreferences {
  return { ...current, ...patch };
}
