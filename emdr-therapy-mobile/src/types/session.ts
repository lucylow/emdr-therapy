export type SessionStatus =
  | "idle"
  | "preparing"
  | "running"
  | "paused"
  | "interrupted"
  | "completing"
  | "completed"
  | "stopped"
  | "error";
export type AudioState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "interrupted"
  | "error";
export type VisualMode = "soft-orb" | "horizontal-line" | "minimal-dot";

export interface SessionConfig {
  sessionId: string;
  durationSeconds: number;
  audioEnabled: boolean;
  visualEnabled: boolean;
  hapticsEnabled: boolean;
  visualMode: VisualMode;
  audioVolume: number;
}

export interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  elapsedSeconds: number;
  remainingSeconds: number;
  progress: number;
  audioState: AudioState;
  visualEnabled: boolean;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

export type SessionListener = (state: SessionState) => void;

export interface SessionEvent {
  type:
    | "START"
    | "PAUSE"
    | "RESUME"
    | "INTERRUPT"
    | "STOP"
    | "COMPLETE"
    | "AUDIO_READY"
    | "AUDIO_ERROR"
    | "TICK"
    | "RESET";
  timestamp: string;
  message?: string;
}
