import { describe, expect, it } from "vitest";
import {
  hasReflectionContent,
  normalizeReflectionText,
  safeReflectionPreview,
} from "./reflectionRules";

describe("reflection safety helpers", () => {
  it("normalizes repeated whitespace", () =>
    expect(normalizeReflectionText("  hello   world ")).toBe("hello world"));
  it("recognizes mood selections as content", () =>
    expect(hasReflectionContent({ moodAfter: 6 })).toBe(true));
  it("shortens previews", () =>
    expect(safeReflectionPreview("a".repeat(200)).length).toBeLessThanOrEqual(
      90,
    ));
});
