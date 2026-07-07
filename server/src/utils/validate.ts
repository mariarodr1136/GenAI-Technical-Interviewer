import {
  DIFFICULTIES,
  MAX_CODE_CHARS,
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_RESUME_CHARS,
  PERSONAS,
  READINESS_RATINGS,
  TOPICS
} from "../config/constants.ts";
import type { Debrief, InterviewOptions } from "../types.ts";
import { HttpError } from "./httpError.ts";

function pickEnum(
  value: unknown,
  allowed: readonly string[],
  field: string,
  fallback: string
): string {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !allowed.includes(value)) {
    throw new HttpError(
      400,
      `Invalid ${field} "${String(value)}". Expected one of: ${allowed.join(", ")}.`
    );
  }
  return value;
}

function pickCappedText(value: unknown, field: string, maxChars: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new HttpError(400, `${field} must be a string.`);
  return value.trim().slice(0, maxChars) || undefined;
}

export function parseInterviewOptions(body: Record<string, unknown> = {}): InterviewOptions {
  const topic = pickEnum(body.topic, TOPICS, "topic", "general");
  const difficulty = pickEnum(body.difficulty, DIFFICULTIES, "difficulty", "medium");
  const persona = pickEnum(body.persona, PERSONAS, "persona", "professional");
  const jobDescription = pickCappedText(
    body.jobDescription,
    "jobDescription",
    MAX_JOB_DESCRIPTION_CHARS
  );
  const resume = pickCappedText(body.resume, "resume", MAX_RESUME_CHARS);

  return { topic, difficulty, persona, jobDescription, resume };
}

export function parseCode(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new HttpError(400, "code must be a string.");
  return value.trim().slice(0, MAX_CODE_CHARS) || undefined;
}

export function parseDebrief(raw: string): Debrief {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpError(502, "The AI returned a malformed debrief. Please try again.");
  }

  if (parsed === null || typeof parsed !== "object") {
    throw new HttpError(502, "The AI returned an incomplete debrief. Please try again.");
  }
  const d = parsed as Record<string, unknown>;
  const { strengths, areasToImprove, closingNote, readinessRating } = d;
  if (
    typeof strengths !== "string" ||
    typeof areasToImprove !== "string" ||
    typeof closingNote !== "string" ||
    typeof readinessRating !== "string" ||
    !(READINESS_RATINGS as readonly string[]).includes(readinessRating)
  ) {
    throw new HttpError(502, "The AI returned an incomplete debrief. Please try again.");
  }

  return {
    turnCount: typeof d.turnCount === "number" ? d.turnCount : 0,
    topicsCovered: Array.isArray(d.topicsCovered)
      ? d.topicsCovered.filter((t): t is string => typeof t === "string").slice(0, 5)
      : [],
    strengths,
    areasToImprove,
    readinessRating: readinessRating as Debrief["readinessRating"],
    closingNote
  };
}
