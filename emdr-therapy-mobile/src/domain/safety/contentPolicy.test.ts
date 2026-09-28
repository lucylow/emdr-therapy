import { describe, expect, it } from "vitest";
import {
  containsDiagnosticLanguage,
  sanitizeAiReflection,
} from "./contentPolicy";

describe("AI copy guard", () => {
  it("detects explicit diagnosis claims", () =>
    expect(containsDiagnosticLanguage("you have PTSD")).toBe(true));
  it("passes descriptive language", () =>
    expect(containsDiagnosticLanguage("you noted a quieter second half")).toBe(
      false,
    ));
  it("replaces unsafe claim text", () =>
    expect(sanitizeAiReflection("clinical certainty")).toContain(
      "not a diagnosis",
    ));
});
