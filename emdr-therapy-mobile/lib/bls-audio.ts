export const BLS_AUDIO_VOLUMES = [0.25, 0.45, 0.65] as const;
export const BLS_MAX_AUDIO_VOLUME: BlsAudioVolume = 0.65;
export const BLS_SOUNDSCAPE_OPTIONS = ['none', 'rain', 'hum'] as const;

export type BlsAudioVolume = (typeof BLS_AUDIO_VOLUMES)[number];
export type BlsSoundscape = (typeof BLS_SOUNDSCAPE_OPTIONS)[number];

export function getBlsCueIntervalMs(speed: 1 | 2 | 3): 1500 | 1150 | 850 {
  if (speed === 1) return 1500;
  if (speed === 3) return 850;
  return 1150;
}

export function getBlsAudioVolumeLabel(volume: BlsAudioVolume): 'Low' | 'Comfortable' | 'Higher' {
  if (volume === 0.25) return 'Low';
  if (volume === 0.65) return 'Higher';
  return 'Comfortable';
}

export function getBlsSoundscapeLabel(soundscape: BlsSoundscape): 'Off' | 'Soft rain' | 'Low hum' {
  if (soundscape === 'rain') return 'Soft rain';
  if (soundscape === 'hum') return 'Low hum';
  return 'Off';
}

export function getBlsAudioStatusLabel({
  enabled,
  unavailable,
  playing,
  interrupted,
  preparing,
  ready,
  volume,
  soundscape = 'none',
}: {
  enabled: boolean;
  unavailable: boolean;
  playing: boolean;
  interrupted?: boolean;
  preparing?: boolean;
  ready?: boolean;
  volume: BlsAudioVolume;
  soundscape?: BlsSoundscape;
}): string {
  if (unavailable) return 'Audio cues unavailable. Visual stimulation remains active.';
  if (interrupted) return 'Audio playback is paused by the device. Visual stimulation remains active.';
  if (preparing) return 'Audio cues are preparing. Visual stimulation remains active.';
  if (!enabled) return 'Audio cues off. Visual stimulation remains active.';
  const ambience = soundscape === 'none' ? '' : ` with ${getBlsSoundscapeLabel(soundscape).toLowerCase()} background`;
  return `Audio cues enabled at ${getBlsAudioVolumeLabel(volume).toLowerCase()} volume${ambience}${playing ? ', currently playing' : ready ? ', ready' : ''}.`;
}

export function isBlsAudioVolume(value: number): value is BlsAudioVolume {
  return BLS_AUDIO_VOLUMES.includes(value as BlsAudioVolume);
}

export function isBlsSoundscape(value: unknown): value is BlsSoundscape {
  return typeof value === 'string' && BLS_SOUNDSCAPE_OPTIONS.includes(value as BlsSoundscape);
}
