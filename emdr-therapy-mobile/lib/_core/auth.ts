import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

function reportStorageFailure(operation: string, error: unknown): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(
      `[auth] ${operation} failed`,
      error instanceof Error ? error.name : "unknown",
    );
  }
}

export async function getSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") return null;
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    return token && token.trim().length > 0 ? token : null;
  } catch (error) {
    reportStorageFailure("read session", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  if (!token || token.length > 8_192) {
    throw new Error("Authentication could not be completed safely.");
  }

  try {
    if (Platform.OS === "web") return;
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    reportStorageFailure("save session", error);
    throw new Error(
      "Unable to securely save your session. Please try signing in again.",
    );
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch (error) {
    reportStorageFailure("clear session", error);
  }
}

function parseUser(value: string): User | null {
  try {
    const parsed = JSON.parse(value) as Partial<User>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.openId !== "string"
    )
      return null;
    return {
      id: typeof parsed.id === "number" ? parsed.id : 0,
      openId: parsed.openId,
      name: typeof parsed.name === "string" ? parsed.name : null,
      email: typeof parsed.email === "string" ? parsed.email : null,
      loginMethod:
        typeof parsed.loginMethod === "string" ? parsed.loginMethod : null,
      lastSignedIn: parsed.lastSignedIn
        ? new Date(parsed.lastSignedIn)
        : new Date(),
    };
  } catch {
    return null;
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    const info =
      Platform.OS === "web"
        ? window.localStorage.getItem(USER_INFO_KEY)
        : await SecureStore.getItemAsync(USER_INFO_KEY);
    return info ? parseUser(info) : null;
  } catch (error) {
    reportStorageFailure("read user", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    const value = JSON.stringify(user);
    if (Platform.OS === "web") {
      window.localStorage.setItem(USER_INFO_KEY, value);
      return;
    }
    await SecureStore.setItemAsync(USER_INFO_KEY, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    reportStorageFailure("save user", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(USER_INFO_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch (error) {
    reportStorageFailure("clear user", error);
  }
}
