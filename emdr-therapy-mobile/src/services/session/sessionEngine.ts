import { AppState, type AppStateStatus } from "react-native";
import { audioAdapter } from "../audio/audioAdapter";
import {
  applyEvent,
  createInitialSessionState,
} from "../../domain/session/sessionRules";
import { serializeSession } from "../../domain/session/sessionSerializer";
import type {
  SessionConfig,
  SessionListener,
  SessionState,
  SessionEvent,
} from "../../types/session";

export class SessionEngine {
  private state: SessionState = createInitialSessionState();
  private config?: SessionConfig;
  private timer: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription?: { remove: () => void };
  private listeners = new Set<SessionListener>();

  subscribe(listener: SessionListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  async start(config: SessionConfig) {
    this.stopTimer();
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

    this.startTimer();
    this.bindAppState();
  }

  async pause() {
    if (this.state.status !== "running") return;
    try {
      await audioAdapter.pause();
    } finally {
      this.dispatch({ type: "PAUSE", timestamp: new Date().toISOString() });
    }
  }

  async resume() {
    if (this.state.status !== "paused" && this.state.status !== "interrupted")
      return;

    try {
      await audioAdapter.resume();
    } catch {
      // The visual layer can still resume if audio fails.
    }

    this.dispatch({ type: "RESUME", timestamp: new Date().toISOString() });
  }

  async stop() {
    this.stopTimer();

    try {
      await audioAdapter.stop();
    } finally {
      this.dispatch({ type: "STOP", timestamp: new Date().toISOString() });
      this.unbindAppState();
    }
  }

  async complete() {
    this.stopTimer();

    try {
      await audioAdapter.pause();
    } finally {
      this.dispatch({ type: "COMPLETE", timestamp: new Date().toISOString() });
      this.unbindAppState();
    }
  }

  async dispose() {
    this.stopTimer();
    this.unbindAppState();
    await Promise.allSettled([audioAdapter.pause(), audioAdapter.stop()]);
    this.state = createInitialSessionState();
    this.config = undefined;
    this.notify();
  }

  getPersistableState() {
    return serializeSession(this.state);
  }

  private dispatch(event: SessionEvent) {
    if (!this.config) return;

    this.state = applyEvent(this.state, event, this.config);
    this.notify();

    if (this.state.status === "completing") {
      void this.complete();
    }
  }

  private startTimer() {
    if (this.timer) return;

    this.timer = setInterval(() => {
      if (this.state.status !== "running") return;
      this.dispatch({ type: "TICK", timestamp: new Date().toISOString() });
    }, 1000);
  }

  private stopTimer() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private bindAppState() {
    if (this.appStateSubscription) return;

    this.appStateSubscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status !== "active" && this.state.status === "running") {
          void audioAdapter.pause();
          this.dispatch({
            type: "INTERRUPT",
            timestamp: new Date().toISOString(),
            message: "The app lost focus.",
          });
        }
      },
    );
  }

  private unbindAppState() {
    this.appStateSubscription?.remove();
    this.appStateSubscription = undefined;
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const sessionEngine = new SessionEngine();
