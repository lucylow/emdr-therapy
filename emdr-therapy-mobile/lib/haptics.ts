import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function safelyTrigger(action: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  void action().catch((error) => {
    console.warn('[haptics] unavailable', error);
  });
}

export const haptic = {
  light: () => safelyTrigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safelyTrigger(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safelyTrigger(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
