export type SessionFormat =
  | "Audio + Visual"
  | "Visual"
  | "Audio"
  | "Reflection";
export type SessionCategory =
  | "Short"
  | "Focus"
  | "Relax"
  | "Reflection"
  | "Audio"
  | "Visual"
  | "Combined";

export interface Session {
  id: string;
  title: string;
  duration: number;
  format: SessionFormat;
  description: string;
  intensity: "Low" | "Moderate";
  categories: SessionCategory[];
  audioTrack?: string;
  lastPlayed?: string;
  favorite?: boolean;
}

export interface Reflection {
  id: string;
  sessionId: string;
  sessionTitle: string;
  createdAt: string;
  moodBefore: number;
  moodAfter: number;
  text?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  duration: number;
  type: "Guided Voice" | "Ambient" | "Focus Cue" | "Silence";
}

export const USER_PROFILE = {
  id: "demo-profile",
  name: "Demo User",
  reminderEnabled: true,
  reminderTime: "8:00 PM",
  defaultDuration: 12,
};

export const MOCK_DATA_NOTICE =
  "Sample data for preview only. These examples are fictional, are not personal records, and do not show clinical outcomes.";

export const SESSIONS: Session[] = [
  {
    id: "evening-reset",
    title: "Evening Reset",
    duration: 12,
    format: "Audio + Visual",
    description:
      "A short guided audio-visual focus experience for the end of the day.",
    intensity: "Low",
    categories: ["Short", "Relax", "Audio", "Visual", "Combined"],
    audioTrack: "soft-focus",
    lastPlayed: "2026-09-27T20:15:00-04:00",
    favorite: true,
  },
  {
    id: "quiet-focus",
    title: "Quiet Focus",
    duration: 8,
    format: "Visual",
    description:
      "A minimal visual focus experience with optional ambient sound.",
    intensity: "Low",
    categories: ["Short", "Focus", "Visual"],
    audioTrack: "silence",
    lastPlayed: "2026-09-26T18:10:00-04:00",
  },
  {
    id: "grounded-start",
    title: "Grounded Start",
    duration: 10,
    format: "Audio",
    description:
      "A simple guided audio session to create a deliberate beginning.",
    intensity: "Low",
    categories: ["Focus", "Audio"],
    audioTrack: "quiet-voice",
    lastPlayed: "2026-09-25T07:35:00-04:00",
  },
  {
    id: "reflect-reset",
    title: "Reflect & Reset",
    duration: 15,
    format: "Reflection",
    description:
      "A longer guided experience with room for an optional reflection afterward.",
    intensity: "Moderate",
    categories: ["Reflection", "Relax", "Combined"],
    audioTrack: "gentle-ambient",
    lastPlayed: "2026-09-24T21:05:00-04:00",
  },
  {
    id: "wind-down",
    title: "Wind Down",
    duration: 20,
    format: "Audio + Visual",
    description: "A longer evening audio-visual experience with a slower pace.",
    intensity: "Low",
    categories: ["Relax", "Audio", "Visual", "Combined"],
    audioTrack: "rain-room",
  },
  {
    id: "morning-grounding",
    title: "Morning Grounding",
    duration: 7,
    format: "Audio + Visual",
    description: "A short, simple morning focus experience.",
    intensity: "Low",
    categories: ["Short", "Focus", "Audio", "Visual", "Combined"],
    audioTrack: "quiet-voice",
  },
  {
    id: "gentle-focus",
    title: "Gentle Focus",
    duration: 9,
    format: "Audio + Visual",
    description: "A compact guided experience with a soft visual cue.",
    intensity: "Low",
    categories: ["Short", "Focus", "Audio", "Visual", "Combined"],
    audioTrack: "soft-focus",
  },
  {
    id: "minimal-reset",
    title: "Minimal Reset",
    duration: 5,
    format: "Visual",
    description: "A minimal visual-only reset with a short timeline.",
    intensity: "Low",
    categories: ["Short", "Relax", "Visual"],
    audioTrack: "silence",
  },
  {
    id: "room-to-pause",
    title: "Room to Pause",
    duration: 6,
    format: "Visual",
    description: "A short visual-only practice with an easy stop point.",
    intensity: "Low",
    categories: ["Short", "Focus", "Visual"],
    audioTrack: "silence",
  },
  {
    id: "quiet-moment",
    title: "Quiet Moment",
    duration: 5,
    format: "Reflection",
    description: "A brief pause with no required writing or check-in.",
    intensity: "Low",
    categories: ["Short", "Reflection"],
  },
  {
    id: "soft-sound-option",
    title: "Soft Sound Option",
    duration: 8,
    format: "Audio",
    description: "A low-volume audio option that can be turned off at any time.",
    intensity: "Low",
    categories: ["Short", "Audio"],
    audioTrack: "soft-focus",
  },
  {
    id: "visual-only-pause",
    title: "Visual-Only Pause",
    duration: 7,
    format: "Visual",
    description: "A short visual practice without audio or haptic cues.",
    intensity: "Low",
    categories: ["Short", "Visual", "Focus"],
    audioTrack: "silence",
  },
  {
    id: "open-reflection",
    title: "Open Reflection",
    duration: 10,
    format: "Reflection",
    description: "An optional quiet interval; sharing or writing is not required.",
    intensity: "Low",
    categories: ["Reflection", "Relax"],
  },
  {
    id: "easy-evening",
    title: "Easy Evening",
    duration: 11,
    format: "Audio + Visual",
    description: "A brief evening practice with independently optional audio.",
    intensity: "Low",
    categories: ["Relax", "Audio", "Visual", "Combined"],
    audioTrack: "gentle-ambient",
  },
  {
    id: "short-choice",
    title: "Short Choice",
    duration: 4,
    format: "Visual",
    description: "A very short preview practice. Stop whenever you choose.",
    intensity: "Low",
    categories: ["Short", "Visual"],
    audioTrack: "silence",
  },
];

export const AUDIO_TRACKS: AudioTrack[] = [
  { id: "soft-focus", title: "Soft Focus", duration: 720, type: "Ambient" },
  { id: "rain-room", title: "Rain Room", duration: 900, type: "Ambient" },
  {
    id: "gentle-ambient",
    title: "Gentle Ambient",
    duration: 900,
    type: "Ambient",
  },
  {
    id: "quiet-voice",
    title: "Quiet Voice",
    duration: 600,
    type: "Guided Voice",
  },
  { id: "focus-cue", title: "Focus Cue", duration: 720, type: "Focus Cue" },
  { id: "silence", title: "Silence", duration: 720, type: "Silence" },
  { id: "soft-wind", title: "Soft Wind", duration: 660, type: "Ambient" },
  { id: "quiet-room", title: "Quiet Room", duration: 480, type: "Silence" },
  { id: "brief-orientation", title: "Brief Orientation", duration: 300, type: "Guided Voice" },
];

export const REFLECTIONS: Reflection[] = [
  {
    id: "r1",
    sessionId: "evening-reset",
    sessionTitle: "Evening Reset",
    createdAt: "2026-09-27T20:28:00-04:00",
    moodBefore: 5,
    moodAfter: 7,
    text: "Felt more settled during the second half.",
  },
  {
    id: "r2",
    sessionId: "quiet-focus",
    sessionTitle: "Quiet Focus",
    createdAt: "2026-09-26T18:20:00-04:00",
    moodBefore: 6,
    moodAfter: 6,
    text: "Liked the softer visual setting.",
  },
  {
    id: "r3",
    sessionId: "grounded-start",
    sessionTitle: "Grounded Start",
    createdAt: "2026-09-25T07:48:00-04:00",
    moodBefore: 5,
    moodAfter: 6,
    text: "Shorter sessions are easier to fit into my morning.",
  },
  {
    id: "r4",
    sessionId: "reflect-reset",
    sessionTitle: "Reflect & Reset",
    createdAt: "2026-09-24T21:22:00-04:00",
    moodBefore: 4,
    moodAfter: 6,
  },
  {
    id: "r5",
    sessionId: "room-to-pause",
    sessionTitle: "Room to Pause",
    createdAt: "2026-10-01T19:10:00-04:00",
    moodBefore: 5,
    moodAfter: 5,
    text: "Sample note: I chose the visual-only option.",
  },
  {
    id: "r6",
    sessionId: "quiet-moment",
    sessionTitle: "Quiet Moment",
    createdAt: "2026-10-02T12:05:00-04:00",
    moodBefore: 6,
    moodAfter: 4,
    text: "Sample note: I stopped early and took a break.",
  },
  {
    id: "r7",
    sessionId: "visual-only-pause",
    sessionTitle: "Visual-Only Pause",
    createdAt: "2026-10-04T18:25:00-04:00",
    moodBefore: 5,
    moodAfter: 5,
    text: "Sample note: I preferred no sound today.",
  },
  {
    id: "r8",
    sessionId: "open-reflection",
    sessionTitle: "Open Reflection",
    createdAt: "2026-10-06T08:40:00-04:00",
    moodBefore: 4,
    moodAfter: 6,
    text: "Sample note: I left the reflection blank.",
  },
];

export const WEEKLY_DATA = [
  { label: "M", minutes: 12, sessions: 1 },
  { label: "T", minutes: 8, sessions: 1 },
  { label: "W", minutes: 0, sessions: 0 },
  { label: "T", minutes: 10, sessions: 1 },
  { label: "F", minutes: 0, sessions: 0 },
  { label: "S", minutes: 15, sessions: 1 },
  { label: "S", minutes: 12, sessions: 1 },
];

export const WAVEFORM_HEIGHTS = Array.from({ length: 56 }, (_, index) => {
  const a = Math.abs(Math.sin(index * 0.42)) * 0.55;
  const b = Math.abs(Math.cos(index * 0.16)) * 0.3;
  const c = ((index % 7) / 7) * 0.15;
  return Math.round(18 + (a + b + c) * 55);
});

export const MOOD_OPTIONS = [
  { id: "better", label: "Better", value: 7, icon: "happy-outline" as const },
  {
    id: "same",
    label: "About the same",
    value: 5,
    icon: "remove-circle-outline" as const,
  },
  {
    id: "unsettled",
    label: "More unsettled",
    value: 3,
    icon: "sad-outline" as const,
  },
];

export const AI_REFLECTIONS = [
  "You noted that the second half of your session felt easier to stay with.",
  "You preferred the softer visual setting during your evening session.",
  "Your recent sessions have mostly been short evening experiences.",
];
