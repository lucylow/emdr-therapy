import { describe, expect, it } from "vitest";
import {
  clampPreference,
  DEFAULT_PREFERENCES,
  updateAudioPreference,
} from "./preferencesSchema";

describe("preference validation", () => {
  it("clamps below zero", () => expect(clampPreference(-1)).toBe(0));
  it("clamps above one hundred", () => expect(clampPreference(101)).toBe(100));
  it("preserves unrelated audio values during a patch", () => {
    const result = updateAudioPreference(DEFAULT_PREFERENCES, {
      masterVolume: 74,
    });
    expect(result.audio.masterVolume).toBe(74);
    expect(result.audio.voiceLevel).toBe(55);
  });
});
