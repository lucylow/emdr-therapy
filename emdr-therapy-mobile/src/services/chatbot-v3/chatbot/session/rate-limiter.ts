interface Bucket { start: number; count: number; blockedUntil: number; }
export interface RateLimitResult { allowed: boolean; retryAfterMs: number; remaining: number; }

/** In-memory per-session rate limit to prevent accidental duplicate sends or runaway costs. */
export class LocalChatRateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly cooldownMs: number;
  private readonly maxBuckets: number;
  private readonly now: () => number;
  constructor(options: { maxRequests?: number; windowMs?: number; cooldownMs?: number; maxBuckets?: number; now?: () => number } = {}) {
    this.maxRequests = bounded(options.maxRequests, 12, 1, 1000);
    this.windowMs = bounded(options.windowMs, 60_000, 1000, 60 * 60_000);
    this.cooldownMs = bounded(options.cooldownMs, 5000, 0, 60 * 60_000);
    this.maxBuckets = bounded(options.maxBuckets, 250, 1, 10000);
    this.now = options.now ?? Date.now;
  }
  check(key: string): RateLimitResult {
    this.cleanup();
    const id = sanitizeKey(key);
    const now = this.now();
    let bucket = this.buckets.get(id);
    if (!bucket || now - bucket.start >= this.windowMs) {
      bucket = { start: now, count: 0, blockedUntil: 0 };
      this.buckets.delete(id);
      this.buckets.set(id, bucket);
    }
    if (now < bucket.blockedUntil) return { allowed: false, retryAfterMs: bucket.blockedUntil - now, remaining: 0 };
    if (bucket.count >= this.maxRequests) {
      bucket.blockedUntil = now + this.cooldownMs;
      return { allowed: false, retryAfterMs: this.cooldownMs, remaining: 0 };
    }
    bucket.count++;
    return { allowed: true, retryAfterMs: 0, remaining: Math.max(0, this.maxRequests - bucket.count) };
  }
  reset(key?: string): void { if (key) this.buckets.delete(sanitizeKey(key)); else this.buckets.clear(); }
  cleanup(): number {
    const now = this.now(); let removed = 0;
    for (const [id, bucket] of this.buckets) if (now - bucket.start > this.windowMs * 3 && now >= bucket.blockedUntil) { this.buckets.delete(id); removed++; }
    while (this.buckets.size > this.maxBuckets) { const id = this.buckets.keys().next().value as string | undefined; if (!id) break; this.buckets.delete(id); removed++; }
    return removed;
  }
  diagnostics(): { trackedSessions: number; } { this.cleanup(); return { trackedSessions: this.buckets.size }; }
}
function bounded(value: unknown, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value as number))) : fallback; }
function sanitizeKey(value: string): string { return String(value ?? 'default').slice(0, 80).replace(/[^a-zA-Z0-9._:-]/gu, '_') || 'default'; }
