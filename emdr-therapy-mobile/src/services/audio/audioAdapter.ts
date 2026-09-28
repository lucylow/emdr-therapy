export interface AudioSnapshot {
  state:
    | "idle"
    | "loading"
    | "ready"
    | "playing"
    | "paused"
    | "interrupted"
    | "error";
  trackId?: string;
  positionSeconds: number;
  durationSeconds: number;
  volume: number;
  error?: string;
}

export interface AudioAdapter {
  load(trackId: string, durationSeconds: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  setVolume(value: number): Promise<void>;
  getSnapshot(): AudioSnapshot;
  subscribe(listener: (snapshot: AudioSnapshot) => void): () => void;
}

class MockAudioAdapter implements AudioAdapter {
  private snapshot: AudioSnapshot = {
    state: "idle",
    positionSeconds: 0,
    durationSeconds: 0,
    volume: 0.62,
  };
  private listeners = new Set<(snapshot: AudioSnapshot) => void>();

  async load(trackId: string, durationSeconds: number) {
    this.snapshot = {
      ...this.snapshot,
      state: "loading",
      trackId,
      durationSeconds,
      positionSeconds: 0,
    };
    this.notify();
    await new Promise((resolve) => setTimeout(resolve, 120));
    this.snapshot = { ...this.snapshot, state: "ready" };
    this.notify();
  }

  async play() {
    this.snapshot = { ...this.snapshot, state: "playing" };
    this.notify();
  }
  async pause() {
    this.snapshot = { ...this.snapshot, state: "paused" };
    this.notify();
  }
  async resume() {
    this.snapshot = { ...this.snapshot, state: "playing" };
    this.notify();
  }
  async stop() {
    this.snapshot = { ...this.snapshot, state: "paused", positionSeconds: 0 };
    this.notify();
  }
  async setVolume(value: number) {
    this.snapshot = {
      ...this.snapshot,
      volume: Math.min(1, Math.max(0, value)),
    };
    this.notify();
  }
  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: AudioSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  interrupt() {
    this.snapshot = { ...this.snapshot, state: "interrupted" };
    this.notify();
  }

  fail(message = "Audio could not be loaded.") {
    this.snapshot = { ...this.snapshot, state: "error", error: message };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}

export const audioAdapter = new MockAudioAdapter();
