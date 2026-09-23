import { getBlsAudioStatusLabel, getBlsAudioVolumeLabel, getBlsSoundscapeLabel, type BlsAudioVolume, type BlsSoundscape } from './bls-audio';

export type AudioStatusCardModel = {
  title: string;
  accessibilityLabel: string;
  showRetry: boolean;
  retryLabel: string;
  helperText?: string;
};

export function getAudioStatusCardModel({
  audioOn,
  audioUnavailable,
  audioInterrupted,
  audioPreparing,
  audioReady,
  audioPlaying,
  audioRetrying,
  audioVolume,
  soundscape,
}: {
  audioOn: boolean;
  audioUnavailable: boolean;
  audioInterrupted: boolean;
  audioPreparing: boolean;
  audioReady: boolean;
  audioPlaying: boolean;
  audioRetrying: boolean;
  audioVolume: BlsAudioVolume;
  soundscape: BlsSoundscape;
}): AudioStatusCardModel {
  const accessibilityLabel = getBlsAudioStatusLabel({ enabled: audioOn, unavailable: audioUnavailable, interrupted: audioInterrupted, preparing: audioPreparing, ready: audioReady, playing: audioPlaying, volume: audioVolume, soundscape });
  const title = audioUnavailable ? 'Visual-only mode' : audioInterrupted ? 'Audio paused by device' : audioOn ? `Audio cues · ${getBlsAudioVolumeLabel(audioVolume)}${soundscape === 'none' ? '' : ` · ${getBlsSoundscapeLabel(soundscape)}`}${audioPreparing ? ' · preparing' : audioPlaying ? ' · playing' : audioReady ? ' · ready' : ''}` : 'Audio cues off';
  return { title, accessibilityLabel, showRetry: audioInterrupted || audioUnavailable, retryLabel: audioRetrying ? 'Retrying…' : 'Retry audio', helperText: audioUnavailable || audioInterrupted ? 'Visual stimulation remains active.' : undefined };
}
