import { describe, expect, it } from "vitest";
import {
  AUDIO_TRACKS,
  MOCK_DATA_NOTICE,
  REFLECTIONS,
  SESSIONS,
  USER_PROFILE,
} from "../src/data/mock";

describe("representative mock content", () => {
  it("labels the profile and sample records as demo data", () => {
    expect(USER_PROFILE.id).toBe("demo-profile");
    expect(USER_PROFILE.name).toBe("Demo User");
    expect(MOCK_DATA_NOTICE.toLowerCase()).toContain("sample data");
    expect(MOCK_DATA_NOTICE.toLowerCase()).toContain("clinical outcomes");
    expect(MOCK_DATA_NOTICE.toLowerCase()).toContain("fictional");
  });

  it("keeps session ids unique and audio references valid", () => {
    const ids = SESSIONS.map((session) => session.id);
    expect(new Set(ids).size).toBe(ids.length);
    const trackIds = new Set(AUDIO_TRACKS.map((track) => track.id));
    for (const session of SESSIONS) {
      expect(session.duration).toBeGreaterThan(0);
      if (session.audioTrack) expect(trackIds.has(session.audioTrack)).toBe(true);
    }
  });

  it("keeps reflection examples within the display scale and uses valid session ids", () => {
    const sessionIds = new Set(SESSIONS.map((session) => session.id));
    const reflectionIds = REFLECTIONS.map((reflection) => reflection.id);
    expect(new Set(reflectionIds).size).toBe(reflectionIds.length);
    for (const reflection of REFLECTIONS) {
      expect(sessionIds.has(reflection.sessionId)).toBe(true);
      expect(reflection.moodBefore).toBeGreaterThanOrEqual(1);
      expect(reflection.moodBefore).toBeLessThanOrEqual(10);
      expect(reflection.moodAfter).toBeGreaterThanOrEqual(1);
      expect(reflection.moodAfter).toBeLessThanOrEqual(10);
      expect(Number.isNaN(Date.parse(reflection.createdAt))).toBe(false);
    }
  });
});
