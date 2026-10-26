import { guardGeneratedResponse, type GuardOptions } from './output-guard.ts';
import type { ResponseGuardResult } from '../types.ts';

export interface GuardedStreamResult extends ResponseGuardResult {
  bufferedChars: number;
  truncated: boolean;
  chunkCount: number;
}

/**
 * Buffers a streamed model response and releases no user-visible content until the full output
 * has passed the output guard. This trades first-token latency for safer UI delivery.
 */
export async function collectGuardedStream(
  chunks: AsyncIterable<unknown>,
  options: GuardOptions & { maxBufferChars?: number; signal?: AbortSignal } = {},
): Promise<GuardedStreamResult> {
  const maxBuffer = Math.max(80, Math.min(30000, Math.floor(options.maxBufferChars ?? 12000)));
  const parts: string[] = [];
  let bufferedChars = 0;
  let chunkCount = 0;
  let truncated = false;
  for await (const chunk of chunks) {
    if (options.signal?.aborted) return { safe: false, text: '', violations: ['stream_aborted'], modified: true, bufferedChars, truncated, chunkCount };
    if (typeof chunk !== 'string') continue;
    chunkCount++;
    const remaining = maxBuffer - bufferedChars;
    if (remaining <= 0) { truncated = true; break; }
    const part = chunk.slice(0, remaining);
    parts.push(part);
    bufferedChars += part.length;
    if (part.length < chunk.length) { truncated = true; break; }
  }
  const raw = parts.join('');
  if (truncated) return { safe: false, text: '', violations: ['stream_buffer_limit'], modified: true, bufferedChars, truncated, chunkCount };
  const guarded = guardGeneratedResponse(raw, options);
  return { ...guarded, bufferedChars, truncated, chunkCount };
}

export async function* chunksFromText(text: string, chunkSize = 12): AsyncGenerator<string> {
  const size = Math.max(1, Math.min(1024, Math.floor(chunkSize)));
  for (let offset = 0; offset < text.length; offset += size) yield text.slice(offset, offset + size);
}
