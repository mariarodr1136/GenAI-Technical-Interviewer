import { describe, expect, it } from "vitest";
import { sanitizeText } from "../src/lib/sanitizer.ts";

describe("sanitizeText", () => {
  it("replaces every banned word", () => {
    expect(sanitizeText("A scalable, secure, robust system.")).toBe(
      "A able to handle growth, protected, reliable system."
    );
  });

  it("is case-insensitive", () => {
    expect(sanitizeText("Scalable and SECURE")).toBe("able to handle growth and protected");
  });

  it("respects word boundaries", () => {
    expect(sanitizeText("securely robustness scalability")).toBe("securely robustness scalability");
  });

  it("passes clean text through untouched", () => {
    expect(sanitizeText("Tell me about hash maps.")).toBe("Tell me about hash maps.");
  });
});
