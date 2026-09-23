export type RecoveryActionState = 'idle' | 'working' | 'error';

export function recoveryActionLabel(action: 'resume' | 'ground' | 'discard', state: RecoveryActionState): string {
  if (state === 'working') return action === 'ground' ? 'Opening grounding' : action === 'discard' ? 'Discarding session' : 'Resuming session';
  if (state === 'error') return 'Try recovery action again';
  return action === 'ground' ? 'Ground instead of resuming' : action === 'discard' ? 'Discard paused training session' : 'Resume paused training session';
}
