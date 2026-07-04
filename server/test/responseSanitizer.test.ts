import { describe, expect, it } from "vitest";
import { sanitizeInterviewResponse } from "../src/utils/responseSanitizer.ts";

describe("sanitizeInterviewResponse", () => {
  // Regression test: these patterns were once written as /\\bscalable\\b/
  // (escaped backslashes), which never matched anything.
  it("replaces banned words regardless of casing", () => {
    expect(sanitizeInterviewResponse("Make it Scalable and SECURE and robust.")).toBe(
      "Make it able to handle growth and protected and reliable."
    );
  });

  it("only matches whole words", () => {
    expect(sanitizeInterviewResponse("securely robustness scalability")).toBe(
      "securely robustness scalability"
    );
  });

  it("handles nullish input", () => {
    expect(sanitizeInterviewResponse(null)).toBe("");
    expect(sanitizeInterviewResponse(undefined)).toBe("");
  });

  it("leaves clean text untouched", () => {
    const text = "Walk me through your approach to caching.";
    expect(sanitizeInterviewResponse(text)).toBe(text);
  });
});

describe("reasoning model output", () => {
  it("strips closed <think> blocks", () => {
    expect(sanitizeInterviewResponse("<think>secret reasoning</think>Hello there.")).toBe(
      "Hello there."
    );
  });

  it("strips an unterminated <think> block from a truncated response", () => {
    expect(sanitizeInterviewResponse("<think>reasoning that got cut off")).toBe("");
  });

  it("still applies banned-word replacements after stripping", () => {
    expect(sanitizeInterviewResponse("<think>plan</think>Build something robust.")).toBe(
      "Build something reliable."
    );
  });
});
