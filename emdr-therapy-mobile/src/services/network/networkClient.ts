export interface NetworkResult<T> {
  ok: boolean;
  data?: T;
  status?: number;
  error?: string;
  retryable: boolean;
}

type FetchInput = Parameters<typeof fetch>[0];
type FetchOptions = Parameters<typeof fetch>[1];

export async function requestJson<T>(
  input: FetchInput,
  init: FetchOptions = {},
  timeoutMs = 12000,
): Promise<NetworkResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const raw = await response.text();
    let data: unknown = undefined;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = undefined;
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          response.status >= 500
            ? "Server temporarily unavailable."
            : "Request could not be completed.",
        retryable: response.status >= 500 || response.status === 429,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
      retryable: false,
    };
  } catch (error) {
    const timeout = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      error: timeout
        ? "The request took too long."
        : "You appear to be offline.",
      retryable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}
