import type { ChatModelProvider, ChatProviderRequest, ChatProviderResponse } from '../types.ts';

export type ProviderFailureCode = 'timeout' | 'aborted' | 'provider_error' | 'invalid_response';
export class ProviderRunError extends Error {
  readonly code: ProviderFailureCode;
  constructor(code: ProviderFailureCode, message: string) { super(message); this.name = 'ProviderRunError'; this.code = code; }
}

/** Runs one bounded provider request. No retries are implicit. */
export async function runProviderSafely(
  provider: ChatModelProvider,
  request: ChatProviderRequest,
  timeoutMs = 9000,
  externalSignal?: AbortSignal,
): Promise<ChatProviderResponse> {
  if (!provider || typeof provider.generate !== 'function') throw new ProviderRunError('provider_error', 'Provider adapter is invalid.');
  if (externalSignal?.aborted) throw new ProviderRunError('aborted', 'Request was cancelled.');
  const controller = new AbortController();
  const propagateAbort = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', propagateAbort, { once: true });
  const timeout = Math.max(250, Math.min(120000, timeoutMs));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort(new Error('provider_timeout'));
      reject(new ProviderRunError('timeout', 'Provider request timed out.'));
    }, timeout);
  });
  const work = provider.generate({ ...request, signal: controller.signal }).then((response) => {
    if (!response || typeof response.text !== 'string') throw new ProviderRunError('invalid_response', 'Provider returned an invalid response.');
    return { ...response, text: response.text.slice(0, 30000) };
  }).catch((error: unknown) => {
    if (error instanceof ProviderRunError) throw error;
    if (controller.signal.aborted) throw new ProviderRunError(externalSignal?.aborted ? 'aborted' : 'provider_error', 'Provider request was cancelled or failed.');
    throw new ProviderRunError('provider_error', 'Provider request failed.');
  });
  try {
    return await Promise.race([work, timeoutPromise]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    externalSignal?.removeEventListener('abort', propagateAbort);
    controller.abort();
  }
}
