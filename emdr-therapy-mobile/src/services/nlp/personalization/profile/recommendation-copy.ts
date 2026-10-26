import type { LanguageCode, PreferenceKey } from '../core/types.ts';

const KEY_LABELS: Record<PreferenceKey, Record<LanguageCode, string>> = {
  language: { en: 'language', fr: 'langue', es: 'idioma' },
  responseLength: { en: 'response length', fr: 'longueur des réponses', es: 'longitud de las respuestas' },
  tone: { en: 'writing tone', fr: 'ton rédactionnel', es: 'tono de escritura' },
  visualTheme: { en: 'visual theme', fr: 'thème visuel', es: 'tema visual' },
  reducedMotion: { en: 'reduced motion', fr: 'mouvement réduit', es: 'movimiento reducido' },
  soundEnabled: { en: 'sound', fr: 'son', es: 'sonido' },
  hapticsEnabled: { en: 'haptics', fr: 'retour haptique', es: 'vibración háptica' },
  captionsEnabled: { en: 'captions', fr: 'sous-titres', es: 'subtítulos' },
  fontScale: { en: 'text size', fr: 'taille du texte', es: 'tamaño del texto' },
  suggestionDensity: { en: 'suggestion density', fr: 'nombre de suggestions', es: 'cantidad de sugerencias' },
  preferredSupportTools: { en: 'preferred optional activities', fr: 'activités facultatives préférées', es: 'actividades opcionales preferidas' },
};

export function preferenceChangePrompt(key: PreferenceKey, language: LanguageCode): string {
  const label = KEY_LABELS[key][language];
  const prompts: Record<LanguageCode, string> = {
    en: `Would you like to keep this ${label} preference? You can change it or clear it at any time.`,
    fr: `Souhaitez-vous conserver cette préférence de ${label} ? Vous pouvez la modifier ou l’effacer à tout moment.`,
    es: `¿Quieres conservar esta preferencia de ${label}? Puedes cambiarla o borrarla en cualquier momento.`,
  };
  return prompts[language];
}

export function explainInferredPreference(language: LanguageCode): string {
  const copy: Record<LanguageCode, string> = {
    en: 'This is only a suggestion based on your explicit ratings or choices. It has not been applied. Confirm, dismiss, or ignore it.',
    fr: 'Il s’agit d’une suggestion fondée sur vos évaluations ou choix explicites. Elle n’a pas été appliquée. Confirmez-la, refusez-la ou ignorez-la.',
    es: 'Es solo una sugerencia basada en tus valoraciones o elecciones explícitas. No se ha aplicado. Confírmala, descártala o ignórala.',
  };
  return copy[language];
}
