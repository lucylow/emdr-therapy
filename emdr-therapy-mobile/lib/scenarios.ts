import type { TrainingPhase } from './training-model';

export type SimulatedPatientScenario = {
  id: string;
  name: string;
  presentingTheme: string;
  readiness: 'learning' | 'needs-preparation';
  assignedPhases: TrainingPhase[];
  teachingNote: string;
};

export const SIMULATED_SCENARIOS: SimulatedPatientScenario[] = [
  { id: 'steady-start', name: 'Steady Start', presentingTheme: 'A mild present-day stressor with clear access to a calming image.', readiness: 'learning', assignedPhases: ['Preparation', 'Assessment', 'Closure'], teachingNote: 'Practice pacing, consent, and orientation without moving into unsupervised trauma processing.' },
  { id: 'needs-grounding', name: 'Needs Grounding', presentingTheme: 'The simulated patient becomes distracted and has difficulty returning to the room.', readiness: 'needs-preparation', assignedPhases: ['History & treatment planning', 'Preparation', 'Closure'], teachingNote: 'Practice pausing, orienting, and choosing preparation over escalation when readiness is uncertain.' },
  { id: 'sud-shift', name: 'SUD Shift', presentingTheme: 'A simulated SUD change across a short training set with a clear stop signal.', readiness: 'learning', assignedPhases: ['Assessment', 'Desensitization', 'Body scan', 'Closure'], teachingNote: 'Practice recording observations and using the stop control instead of treating the score as an instruction.' },
];
