export interface TimerState {
  elapsedSeconds: number;
  remainingSeconds: number;
  durationSeconds: number;
  progress: number;
  running: boolean;
}

export function createTimerState(durationSeconds: number): TimerState {
  return {
    elapsedSeconds: 0,
    remainingSeconds: Math.max(0, durationSeconds),
    durationSeconds: Math.max(0, durationSeconds),
    progress: 0,
    running: false,
  };
}

export function tickTimer(state: TimerState): TimerState {
  if (!state.running || state.remainingSeconds <= 0) return state;
  const elapsed = Math.min(state.durationSeconds, state.elapsedSeconds + 1);
  const remaining = Math.max(0, state.durationSeconds - elapsed);
  const progress =
    state.durationSeconds === 0 ? 1 : elapsed / state.durationSeconds;
  return {
    ...state,
    elapsedSeconds: elapsed,
    remainingSeconds: remaining,
    progress,
    running: remaining > 0,
  };
}

export function startTimer(state: TimerState): TimerState {
  return { ...state, running: true };
}
export function pauseTimer(state: TimerState): TimerState {
  return { ...state, running: false };
}
export function resetTimer(durationSeconds: number): TimerState {
  return createTimerState(durationSeconds);
}

export class SessionTimer {
  private state: TimerState;
  private interval?: ReturnType<typeof setInterval>;
  private listeners = new Set<(state: TimerState) => void>();

  constructor(durationSeconds: number) {
    this.state = createTimerState(durationSeconds);
  }

  getState() {
    return this.state;
  }

  subscribe(listener: (state: TimerState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  start() {
    this.state = startTimer(this.state);
    this.notify();
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.state = tickTimer(this.state);
      this.notify();
      if (!this.state.running) this.stop();
    }, 1000);
  }

  pause() {
    this.state = pauseTimer(this.state);
    this.notify();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  reset() {
    this.stop();
    this.state = resetTimer(this.state.durationSeconds);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}
