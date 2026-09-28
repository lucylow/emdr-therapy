import { AppState, AppStateStatus } from "react-native";

export interface LifecycleSnapshot {
  status: AppStateStatus;
  isActive: boolean;
  changedAt: string;
}

export function createLifecycleSnapshot(
  status: AppStateStatus,
): LifecycleSnapshot {
  return {
    status,
    isActive: status === "active",
    changedAt: new Date().toISOString(),
  };
}

export class LifecycleService {
  private snapshot = createLifecycleSnapshot(AppState.currentState);
  private listeners = new Set<(snapshot: LifecycleSnapshot) => void>();
  private subscription?: { remove: () => void };

  start() {
    if (this.subscription) return;
    this.subscription = AppState.addEventListener("change", (status) => {
      this.snapshot = createLifecycleSnapshot(status);
      this.listeners.forEach((listener) => listener(this.snapshot));
    });
  }

  stop() {
    this.subscription?.remove();
    this.subscription = undefined;
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: LifecycleSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }
}

export const lifecycleService = new LifecycleService();
