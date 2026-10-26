import type { LanguageCode, SupportToolId, ThemeId } from '../core/types.ts';

export interface SupportActivityDefinition {
  readonly id: SupportToolId;
  readonly title: Readonly<Record<LanguageCode, string>>;
  readonly summary: Readonly<Record<LanguageCode, string>>;
  readonly durationMinutes: number;
  readonly requiresMotion: boolean;
  readonly usesAudio: boolean;
  readonly themeMatches: readonly ThemeId[];
  readonly tags: readonly string[];
  readonly defaultEnabled: boolean;
  readonly userInitiatedOnly: true;
  readonly safetyNote: string;
}

export const SUPPORT_ACTIVITY_CATALOG: readonly SupportActivityDefinition[] = [
  {
    id: 'grounding-5-4-3-2-1',
    title: { en: 'Notice your surroundings', fr: 'Observer ce qui vous entoure', es: 'Observar el entorno' },
    summary: { en: 'Choose a few sights, sounds, and physical sensations to notice at your own pace.', fr: 'Choisissez quelques images, sons et sensations à remarquer à votre rythme.', es: 'Elige algunas imágenes, sonidos y sensaciones para notar a tu ritmo.' },
    durationMinutes: 3, requiresMotion: false, usesAudio: false,
    themeMatches: ['body-and-senses', 'nature-and-outdoors', 'movement-and-rest'], tags: ['grounding', 'sensory', 'optional'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'Skip any sense or prompt that feels uncomfortable; stop whenever you choose.',
  },
  {
    id: 'paced-breathing',
    title: { en: 'Gentle breathing', fr: 'Respiration douce', es: 'Respiración suave' },
    summary: { en: 'Try comfortable, unforced breathing; use your normal rhythm or leave this activity.', fr: 'Essayez une respiration confortable et sans effort, ou quittez cet exercice.', es: 'Prueba una respiración cómoda y sin esfuerzo, o sal de este ejercicio.' },
    durationMinutes: 2, requiresMotion: false, usesAudio: false,
    themeMatches: ['body-and-senses', 'movement-and-rest'], tags: ['breathing', 'optional', 'body-awareness'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'Do not hold your breath or force a rhythm; stop if you feel dizzy, uncomfortable, or short of breath.',
  },
  {
    id: 'orientation-to-room',
    title: { en: 'Orient to the room', fr: 'Prendre ses repères dans la pièce', es: 'Orientarse en la habitación' },
    summary: { en: 'Look around and name a few neutral details about the place you are in.', fr: 'Regardez autour de vous et nommez quelques détails neutres du lieu.', es: 'Mira a tu alrededor y nombra algunos detalles neutrales del lugar.' },
    durationMinutes: 2, requiresMotion: false, usesAudio: false,
    themeMatches: ['body-and-senses', 'daily-routines'], tags: ['grounding', 'orientation', 'optional'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'Keep eyes open if that feels better; there is no requirement to close your eyes.',
  },
  {
    id: 'gentle-stretch',
    title: { en: 'Optional gentle movement', fr: 'Mouvement doux facultatif', es: 'Movimiento suave opcional' },
    summary: { en: 'If comfortable, try a small shoulder roll or adjust your posture.', fr: 'Si cela vous convient, faites un petit mouvement d’épaules ou ajustez votre posture.', es: 'Si te resulta cómodo, prueba un pequeño movimiento de hombros o ajusta tu postura.' },
    durationMinutes: 2, requiresMotion: false, usesAudio: false,
    themeMatches: ['movement-and-rest', 'body-and-senses'], tags: ['movement', 'choice', 'optional'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'Stay within your comfort and physical limits; skipping is always appropriate.',
  },
  {
    id: 'quiet-pause',
    title: { en: 'Take a quiet pause', fr: 'Faire une pause calme', es: 'Hacer una pausa tranquila' },
    summary: { en: 'Set aside a moment without prompts, scoring, or stimulation.', fr: 'Prenez un moment sans consignes, scores ni stimulation.', es: 'Tómate un momento sin indicaciones, puntuaciones ni estimulación.' },
    durationMinutes: 1, requiresMotion: false, usesAudio: false,
    themeMatches: ['movement-and-rest', 'daily-routines', 'self-compassion'], tags: ['pause', 'quiet', 'low-demand'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'This is an optional pause, not a treatment or a required step.',
  },
  {
    id: 'sensory-preferences',
    title: { en: 'Adjust sensory settings', fr: 'Ajuster les réglages sensoriels', es: 'Ajustar los ajustes sensoriales' },
    summary: { en: 'Review optional sound, motion, contrast, captions, and reduced-motion settings.', fr: 'Vérifiez les options de son, mouvement, contraste, sous-titres et mouvement réduit.', es: 'Revisa las opciones de sonido, movimiento, contraste, subtítulos y movimiento reducido.' },
    durationMinutes: 1, requiresMotion: false, usesAudio: false,
    themeMatches: ['body-and-senses'], tags: ['accessibility', 'settings', 'control'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'Settings change only after you confirm them; they never start a stimulation session.',
  },
  {
    id: 'short-reflection',
    title: { en: 'Optional short reflection', fr: 'Courte réflexion facultative', es: 'Reflexión breve opcional' },
    summary: { en: 'Write one sentence about what you want to remember from the moment, or skip writing.', fr: 'Écrivez une phrase à retenir de ce moment, ou choisissez de ne pas écrire.', es: 'Escribe una frase que quieras recordar de este momento, o no escribas nada.' },
    durationMinutes: 3, requiresMotion: false, usesAudio: false,
    themeMatches: ['self-compassion', 'daily-routines', 'uncertainty-and-change'], tags: ['reflection', 'writing', 'optional'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'Do not prompt for traumatic details; the note should be optional, local, and deletable.',
  },
  {
    id: 'kind-self-talk',
    title: { en: 'A kinder phrase', fr: 'Une phrase bienveillante', es: 'Una frase amable' },
    summary: { en: 'Choose or adapt a simple non-judgmental phrase for yourself.', fr: 'Choisissez ou adaptez une phrase simple et sans jugement pour vous-même.', es: 'Elige o adapta una frase sencilla y sin juzgarte.' },
    durationMinutes: 1, requiresMotion: false, usesAudio: false,
    themeMatches: ['self-compassion', 'relationships-and-connection'], tags: ['self-compassion', 'language', 'optional'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'A phrase is an invitation, not a demand to feel differently.',
  },
  {
    id: 'water-break',
    title: { en: 'Consider a small break', fr: 'Envisager une petite pause', es: 'Considerar una pequeña pausa' },
    summary: { en: 'Consider stretching, getting water, or stepping away from the screen.', fr: 'Pensez à vous étirer, boire de l’eau ou vous éloigner de l’écran.', es: 'Considera estirarte, beber agua o alejarte de la pantalla.' },
    durationMinutes: 2, requiresMotion: false, usesAudio: false,
    themeMatches: ['daily-routines', 'movement-and-rest', 'body-and-senses'], tags: ['break', 'everyday-care', 'optional'], defaultEnabled: true,
    userInitiatedOnly: true, safetyNote: 'This is general everyday-care guidance, not medical advice.',
  },
  {
    id: 'contact-support',
    title: { en: 'Review support options', fr: 'Consulter les options de soutien', es: 'Consultar opciones de apoyo' },
    summary: { en: 'Open region-appropriate, vetted support options from the host app.', fr: 'Ouvrez les options de soutien vérifiées et adaptées à votre région.', es: 'Abre opciones de apoyo verificadas y adecuadas a tu región.' },
    durationMinutes: 0, requiresMotion: false, usesAudio: false,
    themeMatches: ['relationships-and-connection'], tags: ['support', 'human-help'], defaultEnabled: false,
    userInitiatedOnly: true, safetyNote: 'The host app must localize and validate support contacts; do not display invented numbers.',
  },
  {
    id: 'none',
    title: { en: 'No suggestion', fr: 'Aucune suggestion', es: 'Ninguna sugerencia' },
    summary: { en: 'Show no optional activity suggestion.', fr: 'Ne proposer aucune activité facultative.', es: 'No mostrar sugerencias de actividades opcionales.' },
    durationMinutes: 0, requiresMotion: false, usesAudio: false,
    themeMatches: [], tags: ['none'], defaultEnabled: false,
    userInitiatedOnly: true, safetyNote: 'Never suppress fixed safety controls or required application notices.',
  },
];

const BY_ID = new Map(SUPPORT_ACTIVITY_CATALOG.map((item) => [item.id, item]));

export function getActivityDefinition(id: SupportToolId): SupportActivityDefinition | undefined { return BY_ID.get(id); }
export function listDefaultActivities(): readonly SupportActivityDefinition[] { return SUPPORT_ACTIVITY_CATALOG.filter((item) => item.defaultEnabled); }
export function listActivityTitles(language: LanguageCode): Readonly<Record<SupportToolId, string>> {
  return Object.fromEntries(SUPPORT_ACTIVITY_CATALOG.map((item) => [item.id, item.title[language]])) as Record<SupportToolId, string>;
}
export function isSelectableActivity(id: SupportToolId): boolean {
  const item = BY_ID.get(id);
  return !!item && item.id !== 'none';
}
