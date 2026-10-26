import { scrubForModel } from '../privacy/redaction.ts';
import { guardAssistantOutput } from '../safety/output-guard.ts';

export interface RemoteModelRequest { text: string; language: string; intent: string; timeoutMs?: number; }
export interface RemoteModel { generate(request: RemoteModelRequest, signal: AbortSignal): Promise<string>; }
export interface RemoteModelOptions {
  enabled: boolean;
  explicitConsent: boolean;
  includeRawText?: boolean;
  maxTextChars?: number;
  timeoutMs?: number;
}
export type RemoteModelResult =
  | { ok: true; text: string; redactions: number }
  | { ok: false; reason: 'disabled' | 'consent_required' | 'timeout' | 'provider_error' | 'unsafe_output' };

/**
 * Optional adapter boundary. It is never called by the default pipeline.
 * The caller must obtain informed, revocable consent for off-device processing.
 */
export async function tryRemoteGeneration(
  model: RemoteModel,
  input: { text: string; language: string; intent: string },
  options: RemoteModelOptions,
): Promise<RemoteModelResult> {
  if (!options.enabled) return { ok: false, reason: 'disabled' };
  if (!options.explicitConsent) return { ok: false, reason: 'consent_required' };
  const cleaned = scrubForModel(input.text, Math.min(4000, Math.max(100, options.maxTextChars ?? 1800)));
  const controller = new AbortController();
  const timeoutMs = Math.min(15000, Math.max(500, options.timeoutMs ?? 5000));
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => { controller.abort(); reject(new Error('timeout')); }, timeoutMs);
    });
    const generated = await Promise.race([
      model.generate({
        text: options.includeRawText === false ? '[user text omitted by privacy setting]' : cleaned.text,
        language: input.language,
        intent: input.intent,
        timeoutMs,
      }, controller.signal),
      timeoutPromise,
    ]);
    const guarded = guardAssistantOutput(generated);
    if (guarded.blocked) return { ok: false, reason: 'unsafe_output' };
    return { ok: true, text: guarded.text, redactions: options.includeRawText === false ? 0 : cleaned.count };
  } catch (error) {
    return { ok: false, reason: (error instanceof Error && error.message === 'timeout') ? 'timeout' : 'provider_error' };
  } finally {
    if (timeout) clearTimeout(timeout);
    controller.abort();
  }
}
