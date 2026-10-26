import type { KeyValueStore } from './contracts.ts';

/** Test adapter only. Production storage must be selected by the host application. */
export class MemoryKeyValueStore implements KeyValueStore {
  private readonly values = new Map<string, unknown>();
  private readonly failOn = new Set<'get' | 'set' | 'remove' | 'keys' | 'clear'>();

  failNext(operation: 'get' | 'set' | 'remove' | 'keys' | 'clear'): void { this.failOn.add(operation); }
  private check(operation: 'get' | 'set' | 'remove' | 'keys' | 'clear'): void {
    if (this.failOn.delete(operation)) throw new Error(`Injected ${operation} failure`);
  }
  async get<T>(key: string): Promise<T | undefined> {
    this.check('get');
    const value = this.values.get(key);
    return value === undefined ? undefined : structuredClone(value) as T;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.check('set');
    this.values.set(key, structuredClone(value));
  }
  async remove(key: string): Promise<void> { this.check('remove'); this.values.delete(key); }
  async keys(prefix = ''): Promise<readonly string[]> {
    this.check('keys');
    return [...this.values.keys()].filter((key) => key.startsWith(prefix)).sort();
  }
  async clear(prefix = ''): Promise<void> {
    this.check('clear');
    for (const key of [...this.values.keys()]) if (key.startsWith(prefix)) this.values.delete(key);
  }
  /** Test-only count to assert data erasure without exposing actual values. */
  size(): number { return this.values.size; }
}

export class InMemoryMutex {
  private tail: Promise<void> = Promise.resolve();
  async run<T>(operation: () => Promise<T>): Promise<T> {
    const prior = this.tail;
    let release: () => void = () => undefined;
    this.tail = new Promise<void>((resolve) => { release = resolve; });
    await prior;
    try { return await operation(); }
    finally { release(); }
  }
}
