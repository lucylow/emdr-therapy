import { describe, expect, it } from 'vitest';
import { getAudioStatusCardModel } from '../lib/audio-status-card';

const base = {
  audioOn: true,
  audioUnavailable: false,
  audioInterrupted: false,
  audioPreparing: false,
  audioReady: true,
  audioPlaying: false,
  audioRetrying: false,
  audioVolume: 0.45 as const,
  soundscape: 'none' as const,
};

describe('AudioStatusCard states', () => {
  it('shows a ready state without retry controls', () => {
    const model = getAudioStatusCardModel(base);
    expect(model.title).toContain('ready');
    expect(model.showRetry).toBe(false);
    expect(model.helperText).toBeUndefined();
  });

  it('shows an interruption fallback and an actionable retry', () => {
    const model = getAudioStatusCardModel({ ...base, audioInterrupted: true });
    expect(model.title).toBe('Audio paused by device');
    expect(model.showRetry).toBe(true);
    expect(model.retryLabel).toBe('Retry audio');
    expect(model.helperText).toContain('Visual stimulation remains active');
  });

  it('communicates unavailable audio without hiding the visual fallback', () => {
    const model = getAudioStatusCardModel({ ...base, audioUnavailable: true });
    expect(model.title).toBe('Visual-only mode');
    expect(model.accessibilityLabel).toContain('Visual stimulation remains active');
    expect(model.showRetry).toBe(true);
  });

  it('prevents duplicate retry messaging while recovery is busy', () => {
    const model = getAudioStatusCardModel({ ...base, audioInterrupted: true, audioRetrying: true });
    expect(model.retryLabel).toBe('Retrying…');
    expect(model.showRetry).toBe(true);
  });

  it('includes a selected soundscape in ready status copy', () => {
    const model = getAudioStatusCardModel({ ...base, soundscape: 'rain' });
    expect(model.title).toContain('Soft rain');
    expect(model.accessibilityLabel).toContain('soft rain background');
  });
});
