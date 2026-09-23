export type TherapyModality = 'emdr' | 'grounding' | 'mindfulness';
export type TherapySessionStatus = 'scheduled' | 'active' | 'paused' | 'completed' | 'aborted';
export type TherapySession = { id: string; modality: TherapyModality; status: TherapySessionStatus; phase: number; phaseName: string; startedAt?: string; endedAt?: string; initialSud?: number; finalSud?: number; notes: string[]; isSharedWithTherapist: false; offlineOnly: true };
export const EMDR_PHASES = ['Preparation', 'Assessment', 'Desensitization', 'Installation', 'Body scan', 'Closure'];
export function createOfflineSession(initialSud?: number): TherapySession { return { id: `offline_${Date.now()}`, modality: 'emdr', status: 'scheduled', phase: 0, phaseName: EMDR_PHASES[0], startedAt: undefined, initialSud, notes: [], isSharedWithTherapist: false, offlineOnly: true }; }
export function advanceOfflineSession(session: TherapySession, phase: number): TherapySession { const safePhase = Math.max(0, Math.min(EMDR_PHASES.length - 1, phase)); return { ...session, phase: safePhase, phaseName: EMDR_PHASES[safePhase], status: safePhase === EMDR_PHASES.length - 1 ? 'active' : session.status }; }
