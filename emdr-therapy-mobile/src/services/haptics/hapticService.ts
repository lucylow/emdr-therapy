import * as Haptics from "expo-haptics";

export async function tapHaptic(enabled: boolean) {
  if (!enabled) return;
  try {
    await Haptics.selectionAsync();
  } catch {}
}

export async function successHaptic(enabled: boolean) {
  if (!enabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
