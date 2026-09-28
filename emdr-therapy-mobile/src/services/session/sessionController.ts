import type {
  SessionConfig,
  SessionListener,
  SessionState,
} from "../../types/session";
import {
  applyEvent,
  createInitialSessionState,
} from "../../domain/session/sessionRules";
import { audioAdapter } from "../audio/audioAdapter";

export interface SessionController {
  getState(): SessionState;
  subscribe(listener: SessionListener): () => void;
  start(config: SessionConfig): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  complete(): Promise<void>;
  reset(): Promise<void>;
}

export class DefaultSessionController implements SessionController {
  private state: SessionState = createInitialSessionState();
  private config: SessionConfig | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<SessionListener>();
  private disposed = false;

  getState() {
    return this.state;
  }

  subscribe(listener: SessionListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async start(config: SessionConfig) {
    this.assertNotDisposed();
    await this.cleanupMedia();
    this.config = config;
    this.dispatch({ type: "START", timestamp: new Date().toISOString() });

    if (config.audioEnabled) {
      try {
        await audioAdapter.load(config.sessionId, config.durationSeconds);
        this.dispatch({
          type: "AUDIO_READY",
          timestamp: new Date().toISOString(),
        });
        await audioAdapter.setVolume(config.audioVolume);
        await audioAdapter.play();
        this.dispatch({ type: "RESUME", timestamp: new Date().toISOString() });
      } catch {
        this.dispatch({
          type: "AUDIO_ERROR",
          timestamp: new Date().toISOString(),
          message: "Audio is unavailable. The visual experience can continue.",
        });
      }
    }

    this.startTicker();
  }

  async pause() {
    this.assertNotDisposed();
    if (this.state.status !== "running") return;
    try {
      await audioAdapter.pause();
    } finally {
      this.dispatch({ type: "PAUSE", timestamp: new Date().toISOString() });
    }
  }

  async resume() {
    this.assertNotDisposed();
    if (this.state.status !== "paused" && this.state.status !== "interrupted")
      return;
    try {
      await audioAdapter.resume();
    } catch {
      // Audio is optional; state can still resume visually.
    }
    this.dispatch({ type: "RESUME", timestamp: new Date().toISOString() });
  }

  async stop() {
    this.assertNotDisposed();
    this.stopTicker();
    try {
      await audioAdapter.stop();
    } finally {
      this.dispatch({ type: "STOP", timestamp: new Date().toISOString() });
    }
  }

  async complete() {
    this.assertNotDisposed();
    this.stopTicker();
    try {
      await audioAdapter.pause();
    } finally {
      this.dispatch({ type: "COMPLETE", timestamp: new Date().toISOString() });
    }
  }

  async reset() {
    this.assertNotDisposed();
    this.stopTicker();
    await this.cleanupMedia();
    this.dispatch({ type: "RESET", timestamp: new Date().toISOString() });
    this.config = null;
  }

  async dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTicker();
    await this.cleanupMedia();
    this.listeners.clear();
  }

  private startTicker() {
    if (this.timer || !this.config) return;

    this.timer = setInterval(() => {
      if (!this.config || this.state.status !== "running") return;

      const next = applyEvent(
        this.state,
        { type: "TICK", timestamp: new Date().toISOString() },
        this.config,
      );

      this.state = next;
      this.notify();

      if (next.status === "completing") {
        void this.complete();
      }
    }, 1000);
  }

  private stopTicker() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private async cleanupMedia() {
    await Promise.allSettled([audioAdapter.pause(), audioAdapter.stop()]);
  }

  private dispatch(event: Parameters<typeof applyEvent>[1]) {
    if (!this.config && event.type !== "RESET") return;
    if (event.type === "RESET") {
      this.state = createInitialSessionState();
      this.notify();
      return;
    }

    this.state = applyEvent(this.state, event, this.config as SessionConfig);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private assertNotDisposed() {
    if (this.disposed) throw new Error("Session controller has been disposed.");
  }
}
