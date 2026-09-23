export const EMDR_PHASES = [
  'History & treatment planning',
  'Preparation',
  'Assessment',
  'Desensitization',
  'Installation',
  'Body scan',
  'Closure',
  'Reevaluation',
] as const;

export type TrainingPhase = (typeof EMDR_PHASES)[number];

export type SupervisorCue = {
  id: string;
  phase: TrainingPhase;
  title: string;
  teachingCue: string;
  severity: 'observe' | 'pause';
};

export type BoundedBlsConfig = {
  therapistLimit: number;
  baselineSpeed: number;
  currentSud: number;
};

/**
 * Training-only heuristic. It never replaces therapist judgment and never
 * returns a speed outside the configured therapist limit.
 */
export function boundedBlsSpeed({ therapistLimit, baselineSpeed, currentSud }: BoundedBlsConfig): number {
  const safeLimit = Math.max(1, Math.min(10, therapistLimit));
  const safeBaseline = Math.max(1, Math.min(safeLimit, baselineSpeed));
  const conservativeAdjustment = currentSud >= 8 ? -1 : currentSud <= 3 ? 1 : 0;
  return Math.max(1, Math.min(safeLimit, safeBaseline + conservativeAdjustment));
}

export const TRAINING_BOUNDARY = 'Training simulator only. Supervisor cues are heuristic teaching prompts, not clinical instructions or autonomous therapy.';
