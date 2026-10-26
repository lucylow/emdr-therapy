export type CircuitState = 'closed' | 'open' | 'half_open';
export interface CircuitSnapshot { state: CircuitState; consecutiveFailures: number; openedAt?: number; nextProbeAt?: number; probeInFlight: boolean; }

/** Fails closed around the optional remote model; local responses remain available when it opens. */
export class ChatProviderCircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt?: number;
  private probeInFlight = false;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;
  constructor(options: { failureThreshold?: number; cooldownMs?: number; now?: () => number } = {}) {
    this.failureThreshold = bounded(options.failureThreshold, 3, 1, 25);
    this.cooldownMs = bounded(options.cooldownMs, 30_000, 1000, 10 * 60_000);
    this.now = options.now ?? Date.now;
  }
  canAttempt(): boolean {
    if (this.state === 'closed') return true;
    const now = this.now();
    if (this.state === 'open' && now - (this.openedAt ?? now) >= this.cooldownMs) {
      this.state = 'half_open';
      this.probeInFlight = false;
    }
    if (this.state === 'half_open' && !this.probeInFlight) {
      this.probeInFlight = true;
      return true;
    }
    return false;
  }
  recordSuccess(): void {
    this.state = 'closed';
    this.failures = 0;
    this.openedAt = undefined;
    this.probeInFlight = false;
  }
  recordFailure(): void {
    this.failures++;
    this.probeInFlight = false;
    if (this.state === 'half_open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = this.now();
    }
  }
  reset(): void { this.state = 'closed'; this.failures = 0; this.openedAt = undefined; this.probeInFlight = false; }
  snapshot(): CircuitSnapshot {
    return { state: this.state, consecutiveFailures: this.failures, openedAt: this.openedAt, nextProbeAt: this.openedAt === undefined ? undefined : this.openedAt + this.cooldownMs, probeInFlight: this.probeInFlight };
  }
}
function bounded(value: unknown, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback; }
