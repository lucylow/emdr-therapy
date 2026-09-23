import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const REQUEST_TIMEOUT_MS = 15_000;

function safeErrorMessage(status: number): string {
  if (status === 401 || status === 403)
    return "Your session is no longer available. Please sign in again.";
  if (status === 408 || status === 429 || status >= 500)
    return "The service is temporarily unavailable. Please try again shortly.";
  return "The request could not be completed. Please check your details and try again.";
}

function reportDiagnostic(
  event: string,
  details?: Record<string, unknown>,
): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[api] ${event}`, details ?? {});
  }
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (Platform.OS !== "web") {
    const sessionToken = await Auth.getSessionToken();
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  }

  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : endpoint;
  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: Platform.OS === "web" ? "include" : "omit",
      signal: options.signal ?? timeout.signal,
    });

    if (!response.ok) {
      reportDiagnostic("request rejected", {
        endpoint,
        status: response.status,
      });
      throw new ApiError(safeErrorMessage(response.status), response.status);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      reportDiagnostic("request timed out", { endpoint });
      throw new ApiError(
        "The request timed out. Please check your connection and try again.",
      );
    }
    reportDiagnostic("request failed", {
      endpoint,
      error: error instanceof Error ? error.name : "unknown",
    });
    throw new ApiError(
      "Unable to reach the service. Please check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Exchanges an authorization code without exposing it in a URL or client log. */
export async function exchangeOAuthCode(
  code: string,
  state: string,
): Promise<{ sessionToken: string; user: unknown }> {
  const result = await apiCall<{ app_session_id?: string; user?: unknown }>(
    "/api/oauth/mobile",
    {
      method: "POST",
      body: JSON.stringify({ code, state }),
    },
  );

  if (!result.app_session_id) {
    throw new ApiError(
      "Authentication could not be completed safely. Please try again.",
    );
  }

  return { sessionToken: result.app_session_id, user: result.user };
}

export async function logout(): Promise<void> {
  await apiCall<void>("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string;
} | null> {
  try {
    const result = await apiCall<{ user?: any }>("/api/auth/me");
    return result.user ?? null;
  } catch {
    return null;
  }
}

export async function establishSession(token: string): Promise<boolean> {
  try {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) return false;
    const response = await fetch(`${baseUrl}/api/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
}
