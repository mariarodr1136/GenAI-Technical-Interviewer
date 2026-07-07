import { describe, expect, it } from "vitest";
import { formatRunResult } from "../src/lib/codeRunner.ts";

describe("formatRunResult", () => {
  it("shows captured output", () => {
    expect(formatRunResult({ ok: true, output: "42", durationMs: 3 })).toBe("42");
  });

  it("appends the error after any output", () => {
    expect(
      formatRunResult({ ok: false, output: "step 1", error: "TypeError: boom", durationMs: 3 })
    ).toBe("step 1\nTypeError: boom");
  });

  it("labels silent successful runs", () => {
    expect(formatRunResult({ ok: true, output: "", durationMs: 3 })).toBe("(no output)");
  });

  it("labels silent failures", () => {
    expect(formatRunResult({ ok: false, output: "", durationMs: 3 })).toBe(
      "(failed with no output)"
    );
  });
});
