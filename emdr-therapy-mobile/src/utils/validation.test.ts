import { describe, expect, it } from "vitest";
import {
  durationSeconds,
  percentage,
  safeString,
  sessionId,
} from "./validation";

describe("validation", () => {
  it("returns fallback for empty strings", () =>
    expect(safeString("   ", "fallback")).toBe("fallback"));
  it("clamps percentages", () => expect(percentage(150)).toBe(100));
  it("bounds session durations", () => {
    expect(durationSeconds(10)).toBe(30);
    expect(durationSeconds(9000)).toBe(7200);
  });
  it("accepts safe session identifiers", () => {
    expect(sessionId("evening-reset")).toBe("evening-reset");
    expect(sessionId("bad id")).toBeNull();
  });
});
