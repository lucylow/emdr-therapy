export interface AudioPreferences {
  voiceLevel: number;
  ambientLevel: number;
  cueLevel: number;
  masterVolume: number;
  selectedTrackId: string;
}
export interface VisualPreferences {
  enabled: boolean;
  mode: "soft-orb" | "horizontal-line" | "minimal-dot";
  intensity: number;
}
export interface AccessibilityPreferences {
  reduceMotion: boolean;
  largerText: boolean;
  highContrast: boolean;
}
export interface AppPreferences {
  audio: AudioPreferences;
  visual: VisualPreferences;
  accessibility: AccessibilityPreferences;
  hapticsEnabled: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  audio: {
    voiceLevel: 55,
    ambientLevel: 30,
    cueLevel: 15,
    masterVolume: 62,
    selectedTrackId: "soft-focus",
  },
  visual: { enabled: true, mode: "soft-orb", intensity: 35 },
  accessibility: {
    reduceMotion: false,
    largerText: false,
    highContrast: false,
  },
  hapticsEnabled: false,
};

export function clampPreference(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function updateAudioPreference(
  prefs: AppPreferences,
  patch: Partial<AudioPreferences>,
): AppPreferences {
  return {
    ...prefs,
    audio: {
      ...prefs.audio,
      ...patch,
      voiceLevel: clampPreference(patch.voiceLevel ?? prefs.audio.voiceLevel),
      ambientLevel: clampPreference(
        patch.ambientLevel ?? prefs.audio.ambientLevel,
      ),
      cueLevel: clampPreference(patch.cueLevel ?? prefs.audio.cueLevel),
      masterVolume: clampPreference(
        patch.masterVolume ?? prefs.audio.masterVolume,
      ),
    },
  };
}
