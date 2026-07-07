import { describe, expect, it } from "vitest";
import { buildDebriefReport, reportFileName } from "../src/lib/report.ts";
import type { SavedSession } from "../src/types.ts";

const session: SavedSession = {
  id: 1,
  date: "2026-07-06T15:30:00.000Z",
  topic: "system-design",
  difficulty: "hard",
  persona: "strict",
  turnCount: 3,
  conversation: [
    { role: "assistant", content: "Design a URL shortener." },
    { role: "user", content: "I would start with the API.", code: "POST /shorten" },
    { role: "assistant", content: "What about collisions?", isHint: true }
  ],
  debrief: {
    turnCount: 3,
    topicsCovered: ["hashing", "storage"],
    strengths: "Structured thinking.",
    areasToImprove: "Capacity estimates.",
    readinessRating: "Solid",
    closingNote: "Nice session."
  }
};

describe("buildDebriefReport", () => {
  it("includes header metadata with human-readable labels", () => {
    const report = buildDebriefReport(session);
    expect(report).toContain("# Interview Debrief Report");
    expect(report).toContain("**Topic:** System Design");
    expect(report).toContain("**Difficulty:** Hard");
    expect(report).toContain("## Readiness Rating: Solid");
  });

  it("includes debrief sections and topics", () => {
    const report = buildDebriefReport(session);
    expect(report).toContain("Structured thinking.");
    expect(report).toContain("Capacity estimates.");
    expect(report).toContain("- hashing");
    expect(report).toContain("> Nice session.");
  });

  it("includes the transcript with speakers and code blocks", () => {
    const report = buildDebriefReport(session);
    expect(report).toContain("**Interviewer:** Design a URL shortener.");
    expect(report).toContain("**You:** I would start with the API.");
    expect(report).toContain("**Hint:** What about collisions?");
    expect(report).toContain("POST /shorten");
  });

  it("skips the topics section when empty", () => {
    const report = buildDebriefReport({
      ...session,
      debrief: { ...session.debrief, topicsCovered: [] }
    });
    expect(report).not.toContain("## Topics Covered");
  });
});

describe("reportFileName", () => {
  it("builds a dated markdown filename", () => {
    expect(reportFileName(session)).toBe("interview-debrief-system-design-2026-07-06.md");
  });
});
