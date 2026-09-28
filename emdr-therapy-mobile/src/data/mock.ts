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
  id: "alex-morgan",
  name: "Alex Morgan",
  reminderEnabled: true,
  reminderTime: "8:00 PM",
  defaultDuration: 12,
};

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
