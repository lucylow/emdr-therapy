export type QueueItem =
  | { type: "session-complete"; sessionId: string; completedAt: string }
  | { type: "reflection-save"; reflectionId: string };

export interface SyncState {
  status: "idle" | "syncing" | "offline" | "failed";
  pending: number;
  lastSyncedAt?: string;
}

export class SyncQueue {
  private queue: QueueItem[] = [];
  private status: SyncState["status"] = "idle";
  private listeners = new Set<(state: SyncState) => void>();

  enqueue(item: QueueItem) {
    this.queue.push(item);
    this.notify();
  }

  subscribe(listener: (state: SyncState) => void) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): SyncState {
    return { status: this.status, pending: this.queue.length };
  }

  async flush(send: (item: QueueItem) => Promise<void>) {
    if (!this.queue.length) return;
    this.status = "syncing";
    this.notify();

    const remaining: QueueItem[] = [];
    for (const item of this.queue) {
      try {
        await send(item);
      } catch {
        remaining.push(item);
      }
    }

    this.queue = remaining;
    this.status = remaining.length ? "failed" : "idle";
    this.notify();
  }

  markOffline() {
    this.status = "offline";
    this.notify();
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
