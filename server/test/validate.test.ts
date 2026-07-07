import { describe, expect, it } from "vitest";
import {
  MAX_CODE_CHARS,
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_RESUME_CHARS
} from "../src/config/constants.ts";
import { HttpError } from "../src/utils/httpError.ts";
import { parseCode, parseDebrief, parseInterviewOptions } from "../src/utils/validate.ts";

describe("parseInterviewOptions", () => {
  it("applies defaults when fields are missing or empty", () => {
    expect(parseInterviewOptions({})).toEqual({
      topic: "general",
      difficulty: "medium",
      persona: "professional",
      jobDescription: undefined
    });
    expect(parseInterviewOptions({ topic: "" }).topic).toBe("general");
  });

  it("accepts valid enum values", () => {
    const options = parseInterviewOptions({
      topic: "system-design",
      difficulty: "hard",
      persona: "strict"
    });
    expect(options).toMatchObject({
      topic: "system-design",
      difficulty: "hard",
      persona: "strict"
    });
  });

  it("rejects unknown enum values with a 400", () => {
    expect(() => parseInterviewOptions({ topic: "quantum" })).toThrowError(HttpError);
    expect(() => parseInterviewOptions({ difficulty: "impossible" })).toThrowError(/difficulty/);
    expect(() => parseInterviewOptions({ persona: 7 })).toThrowError(/persona/);
    try {
      parseInterviewOptions({ topic: "quantum" });
    } catch (err) {
      expect((err as HttpError).status).toBe(400);
    }
  });

  it("truncates the job description and rejects non-strings", () => {
    const long = "x".repeat(MAX_JOB_DESCRIPTION_CHARS + 500);
    expect(parseInterviewOptions({ jobDescription: long }).jobDescription).toHaveLength(
      MAX_JOB_DESCRIPTION_CHARS
    );
    expect(parseInterviewOptions({ jobDescription: "" }).jobDescription).toBeUndefined();
    expect(() => parseInterviewOptions({ jobDescription: ["a"] })).toThrowError(/jobDescription/);
  });

  it("truncates the resume and rejects non-strings", () => {
    const long = "r".repeat(MAX_RESUME_CHARS + 500);
    expect(parseInterviewOptions({ resume: long }).resume).toHaveLength(MAX_RESUME_CHARS);
    expect(parseInterviewOptions({ resume: "  " }).resume).toBeUndefined();
    expect(parseInterviewOptions({}).resume).toBeUndefined();
    expect(() => parseInterviewOptions({ resume: 42 })).toThrowError(/resume/);
  });
});

describe("parseCode", () => {
  it("passes through and truncates code strings", () => {
    expect(parseCode("const x = 1;")).toBe("const x = 1;");
    expect(parseCode("y".repeat(MAX_CODE_CHARS + 10))).toHaveLength(MAX_CODE_CHARS);
  });

  it("treats empty values as absent and rejects non-strings", () => {
    expect(parseCode(undefined)).toBeUndefined();
    expect(parseCode("")).toBeUndefined();
    expect(parseCode("   ")).toBeUndefined();
    expect(() => parseCode(123)).toThrowError(/code/);
  });
});

describe("parseDebrief", () => {
  const valid = {
    turnCount: 3,
    topicsCovered: ["stacks", "queues"],
    strengths: "Clear reasoning.",
    areasToImprove: "Complexity analysis.",
    readinessRating: "Developing",
    closingNote: "Keep going!"
  };

  it("accepts a well-formed debrief", () => {
    expect(parseDebrief(JSON.stringify(valid))).toEqual(valid);
  });

  it("repairs optional fields", () => {
    const { turnCount: _t, topicsCovered: _c, ...rest } = valid;
    const result = parseDebrief(JSON.stringify(rest));
    expect(result.turnCount).toBe(0);
    expect(result.topicsCovered).toEqual([]);
  });

  it("caps topicsCovered at 5 and drops non-strings", () => {
    const result = parseDebrief(
      JSON.stringify({ ...valid, topicsCovered: ["a", 1, "b", "c", "d", "e", "f"] })
    );
    expect(result.topicsCovered).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("throws 502 on malformed JSON, missing fields, or bad rating", () => {
    for (const bad of [
      "not json",
      "null",
      JSON.stringify({ ...valid, strengths: 42 }),
      JSON.stringify({ ...valid, readinessRating: "Legendary" })
    ]) {
      try {
        parseDebrief(bad);
        expect.unreachable(`expected throw for: ${bad}`);
      } catch (err) {
        expect(err).toBeInstanceOf(HttpError);
        expect((err as HttpError).status).toBe(502);
      }
    }
  });
});
