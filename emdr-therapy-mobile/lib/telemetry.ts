export type TelemetryEvent = {
  id: string;
  createdAt: string;
  type: 'set-started' | 'set-paused' | 'set-stopped' | 'sud-recorded' | 'supervisor-cue' | 'recovery-resumed' | 'recovery-discarded';
  phase: string;
  value?: number;
  note?: string;
};

export type SessionTelemetry = {
  sessionId: string;
  scenarioId: string;
  scenarioName?: string;
  pausePlan?: 'pause' | 'ground' | 'stop';
  mode?: 'visual' | 'audio' | 'haptic' | 'mixed';
  audioOn?: boolean;
  hapticsOn?: boolean;
  speed?: 1 | 2 | 3;
  durationMinutes?: number;
  elapsedSeconds?: number;
  startedAt: string;
  endedAt?: string;
  initialSud?: number;
  finalSud?: number;
  sets: number;
  pauses: number;
  events: TelemetryEvent[];
};

export const TELEMETRY_BOUNDARY = 'Training telemetry supports reflection on the simulator. It is not a clinical outcome measure and should not be interpreted as patient monitoring.';

export function summarizeTelemetry(telemetry: SessionTelemetry) { return { totalEvents: telemetry.events.length, sets: telemetry.sets, pauses: telemetry.pauses, sudChange: telemetry.initialSud !== undefined && telemetry.finalSud !== undefined ? telemetry.initialSud - telemetry.finalSud : null }; }
export function formatTelemetryTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'time unavailable' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
export function isNewTelemetryPhase(events: TelemetryEvent[], index: number) { return index === 0 || events[index - 1]?.phase !== events[index]?.phase; }
