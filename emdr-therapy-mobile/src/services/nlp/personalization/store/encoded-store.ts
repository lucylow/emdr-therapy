import type { Codec, KeyValueStore } from './contracts.ts';

/**
 * Encrypt-at-rest decorator. The application must inject a real platform codec backed by
 * Expo SecureStore / a vetted crypto library. This module intentionally ships no homemade crypto.
 * Data is JSON-serialized before encode; an authenticated codec should reject tampering.
 */
export class EncodedKeyValueStore implements KeyValueStore {
  private readonly base: KeyValueStore;
  private readonly codec: Codec;
  constructor(base: KeyValueStore, codec: Codec) { this.base = base; this.codec = codec; }

  async get<T>(key: string): Promise<T | undefined> {
    const envelope = await this.base.get<unknown>(key);
    if (envelope === undefined) return undefined;
    if (typeof envelope !== 'string') throw new Error('Stored envelope has an invalid format');
    const decoded = await this.codec.decode(envelope);
    let value: unknown;
    try { value = JSON.parse(decoded); }
    catch { throw new Error('Decoded payload is not valid JSON'); }
    return value as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error('Payload cannot be serialized');
    const envelope = await this.codec.encode(serialized);
    await this.base.set(key, envelope);
  }

  remove(key: string): Promise<void> { return this.base.remove(key); }
  keys(prefix?: string): Promise<readonly string[]> { return this.base.keys(prefix); }
  clear(prefix?: string): Promise<void> { return this.base.clear(prefix); }
}

/** Test codec only. Never use it to protect user data in a release build. */
export const identityCodecForTests: Codec = {
  async encode(plainText) { return `TEST_ONLY:${plainText}`; },
  async decode(envelope) {
    if (!envelope.startsWith('TEST_ONLY:')) throw new Error('Invalid test envelope');
    return envelope.slice('TEST_ONLY:'.length);
  },
};
