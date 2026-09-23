import type { BlsMode } from './session-store';

export type SessionFlowParams = {
  duration?: string;
  mode?: BlsMode;
  sud?: string;
  sessionId?: string;
  scenarioId?: string;
  scenarioName?: string;
  pausePlan?: 'pause' | 'ground' | 'stop';
  elapsedSeconds?: string;
  audioOn?: string;
  hapticsOn?: string;
  speed?: string;
  resume?: string;
};

export function createSessionStartParams(input: { duration: number; mode: BlsMode; scenarioId?: string; scenarioName?: string }): SessionFlowParams {
  return {
    duration: String(input.duration),
    mode: input.mode,
    scenarioId: input.scenarioId ?? 'steady-start',
    scenarioName: input.scenarioName ?? 'Steady Start',
  };
}

export function carrySessionParams(params: SessionFlowParams): SessionFlowParams {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== '')) as SessionFlowParams;
}
