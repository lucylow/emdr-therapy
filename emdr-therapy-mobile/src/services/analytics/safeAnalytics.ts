export type SafeEvent =
  | "home_viewed"
  | "session_started"
  | "session_paused"
  | "session_resumed"
  | "session_completed"
  | "reflection_saved"
  | "audio_fallback_used"
  | "offline_state_shown"
  | "permission_prompt_shown";

export interface SafeAnalyticsPayload {
  event: SafeEvent;
  sessionType?: string;
  durationSeconds?: number;
  audioEnabled?: boolean;
  visualEnabled?: boolean;
}

export function trackSafeEvent(payload: SafeAnalyticsPayload) {
  if (__DEV__)
    console.log("[safe-analytics]", payload.event, payload.sessionType ?? "");
}
