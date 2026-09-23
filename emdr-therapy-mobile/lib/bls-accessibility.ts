export type BlsControl = 'audio' | 'haptics';
export type BlsSpeed = 1 | 2 | 3;

export function getBlsToggleAccessibilityLabel(control: BlsControl, enabled: boolean): string {
  const name = control === 'audio' ? 'Audio cues' : 'Haptic cues';
  return `${name} ${enabled ? 'on' : 'off'}`;
}

export function getBlsSpeedAccessibilityLabel(speed: BlsSpeed): string {
  const name = speed === 1 ? 'slow' : speed === 2 ? 'medium' : 'fast';
  return `BLS speed ${name}`;
}
