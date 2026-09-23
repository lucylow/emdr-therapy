import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as ReactNative from "react-native";

export const APP_SCHEME = "emdrflow";
export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";
const OAUTH_STATE_KEY = "oauth_pending_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1_000;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

type PendingOAuthState = {
  nonce: string;
  redirectUri: string;
  issuedAt: number;
};

function reportDiagnostic(event: string, error: unknown): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(
      `[oauth] ${event}`,
      error instanceof Error ? error.name : "unknown",
    );
  }
}

function encodeBase64(value: string): string {
  if (typeof globalThis.btoa === "function") return globalThis.btoa(value);
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) return BufferImpl.from(value, "utf-8").toString("base64");
  throw new Error("Base64 encoding is unavailable");
}

function decodeBase64(value: string): string {
  if (typeof globalThis.atob === "function") return globalThis.atob(value);
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) return BufferImpl.from(value, "base64").toString("utf-8");
  throw new Error("Base64 decoding is unavailable");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function parseState(value: string): PendingOAuthState | null {
  try {
    const parsed = JSON.parse(
      decodeBase64(value),
    ) as Partial<PendingOAuthState>;
    const issuedAt = parsed.issuedAt;
    if (
      !parsed ||
      typeof parsed.nonce !== "string" ||
      parsed.nonce.length < 32 ||
      typeof parsed.redirectUri !== "string" ||
      typeof issuedAt !== "number" ||
      !Number.isFinite(issuedAt)
    )
      return null;
    return {
      nonce: parsed.nonce,
      redirectUri: parsed.redirectUri,
      issuedAt,
    };
  } catch {
    return null;
  }
}

async function savePendingState(value: PendingOAuthState): Promise<void> {
  const serialized = JSON.stringify(value);
  if (ReactNative.Platform.OS === "web") {
    window.sessionStorage.setItem(OAUTH_STATE_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(OAUTH_STATE_KEY, serialized, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function readPendingState(): Promise<PendingOAuthState | null> {
  const value =
    ReactNative.Platform.OS === "web"
      ? window.sessionStorage.getItem(OAUTH_STATE_KEY)
      : await SecureStore.getItemAsync(OAUTH_STATE_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PendingOAuthState>;
    const issuedAt = parsed.issuedAt;
    if (
      !parsed ||
      typeof parsed.nonce !== "string" ||
      typeof parsed.redirectUri !== "string" ||
      typeof issuedAt !== "number" ||
      !Number.isFinite(issuedAt)
    )
      return null;
    return {
      nonce: parsed.nonce,
      redirectUri: parsed.redirectUri,
      issuedAt,
    };
  } catch {
    return null;
  }
}

async function clearPendingState(): Promise<void> {
  if (ReactNative.Platform.OS === "web") {
    window.sessionStorage.removeItem(OAUTH_STATE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(OAUTH_STATE_KEY);
}

export function isOAuthConfigured(): boolean {
  try {
    return Boolean(
      APP_ID &&
      OAUTH_PORTAL_URL &&
      new URL(OAUTH_PORTAL_URL).protocol === "https:",
    );
  } catch {
    return false;
  }
}

export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");
  if (
    ReactNative.Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location
  ) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;
  }
  return "";
}

export const getRedirectUri = (): string => {
  if (ReactNative.Platform.OS === "web")
    return `${getApiBaseUrl()}/api/oauth/callback`;
  return Linking.createURL("/oauth/callback", { scheme: APP_SCHEME });
};

/** Stores a short-lived random state before creating an authorization URL. */
export async function getLoginUrl(): Promise<string | null> {
  if (!isOAuthConfigured()) return null;
  try {
    const redirectUri = getRedirectUri();
    const pending: PendingOAuthState = {
      nonce: bytesToHex(await Crypto.getRandomBytesAsync(32)),
      redirectUri,
      issuedAt: Date.now(),
    };
    await savePendingState(pending);
    const url = new URL(`${OAUTH_PORTAL_URL.replace(/\/$/, "")}/app-auth`);
    url.searchParams.set("appId", APP_ID);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", encodeBase64(JSON.stringify(pending)));
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (error) {
    reportDiagnostic("could not prepare authorization", error);
    return null;
  }
}

/** Validates and consumes the one-time state before exchanging an OAuth code. */
export async function consumeOAuthState(state: string): Promise<boolean> {
  try {
    const [received, pending] = await Promise.all([
      Promise.resolve(parseState(state)),
      readPendingState(),
    ]);
    await clearPendingState();
    if (!received || !pending) return false;
    const isFresh =
      Date.now() - pending.issuedAt >= 0 &&
      Date.now() - pending.issuedAt <= OAUTH_STATE_TTL_MS;
    return (
      isFresh &&
      received.nonce === pending.nonce &&
      received.redirectUri === pending.redirectUri
    );
  } catch (error) {
    reportDiagnostic("could not validate authorization state", error);
    return false;
  }
}

export async function startOAuthLogin(): Promise<string | null> {
  const loginUrl = await getLoginUrl();
  if (!loginUrl) return null;
  try {
    if (ReactNative.Platform.OS === "web") {
      if (typeof window !== "undefined") window.location.assign(loginUrl);
      return null;
    }
    if (!(await Linking.canOpenURL(loginUrl))) return null;
    await Linking.openURL(loginUrl);
  } catch (error) {
    reportDiagnostic("could not open the authorization page", error);
  }
  return null;
}
