import { PermissionsAndroid, Platform } from "react-native";

export type PermissionStatus = "granted" | "denied" | "unavailable";

export async function requestMicrophone(): Promise<PermissionStatus> {
  if (Platform.OS === "ios") return "granted";

  if (Platform.OS === "android") {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED
        ? "granted"
        : "denied";
    } catch {
      return "unavailable";
    }
  }

  return "unavailable";
}
