import { beforeEach, describe, expect, it } from "vitest";
import { clearHistory, loadHistory, saveSession } from "../src/lib/history.ts";
import type { SavedSession } from "../src/types.ts";

function makeSession(id: number): SavedSession {
  return {
    id,
    date: new Date(id).toISOString(),
    topic: "general",
    difficulty: "medium",
    persona: "professional",
    turnCount: 2,
    conversation: [
      { role: "assistant", content: "Question?" },
      { role: "user", content: "Answer." }
    ],
    debrief: {
      turnCount: 2,
      topicsCovered: ["arrays"],
      strengths: "Clear.",
      areasToImprove: "Depth.",
      readinessRating: "Developing",
      closingNote: "Keep going."
    }
  };
}

describe("history", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty list when nothing is stored", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("stores newest sessions first", () => {
    saveSession(makeSession(1));
    saveSession(makeSession(2));
    const sessions = loadHistory();
    expect(sessions.map((s) => s.id)).toEqual([2, 1]);
  });

  it("caps stored sessions at 20", () => {
    for (let i = 1; i <= 25; i++) saveSession(makeSession(i));
    const sessions = loadHistory();
    expect(sessions).toHaveLength(20);
    expect(sessions[0].id).toBe(25);
  });

  it("clears all sessions", () => {
    saveSession(makeSession(1));
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("genai_interview_sessions", "[broken");
    expect(loadHistory()).toEqual([]);
  });
});
