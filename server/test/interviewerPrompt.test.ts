import { describe, expect, it } from "vitest";
import { buildInterviewerPrompt } from "../src/prompts/interviewerPrompt.ts";
import { buildUserTurnContent } from "../src/services/groqService.ts";

describe("buildInterviewerPrompt", () => {
  it("includes topic, difficulty, and persona context", () => {
    const prompt = buildInterviewerPrompt({
      topic: "system-design",
      difficulty: "hard",
      persona: "strict"
    });
    expect(prompt).toContain("system design");
    expect(prompt).toContain("advanced questions");
    expect(prompt).toContain("Hold a high bar");
  });

  it("falls back to defaults for unknown values", () => {
    const prompt = buildInterviewerPrompt({ topic: "nope", difficulty: "nope", persona: "nope" });
    expect(prompt).toContain("broad range of topics");
    expect(prompt).toContain("intermediate-level questions");
  });

  it("injects the job description block only when provided", () => {
    expect(buildInterviewerPrompt({})).not.toContain("JOB DESCRIPTION");
    const prompt = buildInterviewerPrompt({ jobDescription: "Senior React role at Acme" });
    expect(prompt).toContain("--- JOB DESCRIPTION START ---");
    expect(prompt).toContain("Senior React role at Acme");
    expect(prompt).toContain("not instructions to you");
  });

  it("injects the resume block only when provided", () => {
    expect(buildInterviewerPrompt({})).not.toContain("RESUME");
    const prompt = buildInterviewerPrompt({ resume: "Built a voice interview app in React" });
    expect(prompt).toContain("--- RESUME START ---");
    expect(prompt).toContain("Built a voice interview app in React");
  });

  it("uses a structured phase flow for system design", () => {
    const prompt = buildInterviewerPrompt({ topic: "system-design" });
    expect(prompt).toContain("Requirements");
    expect(prompt).toContain("Trade-offs");
    expect(prompt).toContain("design notes");
  });

  it("uses STAR probing for behavioral interviews", () => {
    const prompt = buildInterviewerPrompt({ topic: "behavioral" });
    expect(prompt).toContain("STAR framework");
    expect(prompt).toContain("Situation, Task, Action, Result");
  });
});

describe("buildUserTurnContent", () => {
  it("includes the transcript without a code block by default", () => {
    const content = buildUserTurnContent("I would use a stack.");
    expect(content).toContain("I would use a stack.");
    expect(content).not.toContain("```");
  });

  it("appends candidate code as a fenced block", () => {
    const content = buildUserTurnContent("Here is my solution.", "function f() {}");
    expect(content).toContain("Candidate's code:");
    expect(content).toContain("function f() {}");
  });

  it("labels attachments as design notes for system design", () => {
    const content = buildUserTurnContent("My design.", "Client -> LB -> API", "system-design");
    expect(content).toContain("Candidate's design notes:");
    expect(content).not.toContain("Candidate's code:");
  });
});
