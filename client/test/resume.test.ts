import { describe, expect, it } from "vitest";
import { MAX_RESUME_CHARS, normalizeResumeText } from "../src/lib/resume.ts";

describe("normalizeResumeText", () => {
  it("collapses runs of spaces and tabs", () => {
    expect(normalizeResumeText("Software   Engineer\t\tReact")).toBe("Software Engineer React");
  });

  it("collapses whitespace around newlines", () => {
    expect(normalizeResumeText("Experience  \n\n   React dev")).toBe("Experience\nReact dev");
  });

  it("trims and caps at the resume limit", () => {
    expect(normalizeResumeText("  hi  ")).toBe("hi");
    expect(normalizeResumeText("x".repeat(MAX_RESUME_CHARS + 100))).toHaveLength(MAX_RESUME_CHARS);
  });
});
