export const TOPICS = [
  "general",
  "algorithms",
  "system-design",
  "frontend",
  "backend",
  "behavioral"
] as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const PERSONAS = ["professional", "strict", "encouraging", "fast-paced"] as const;

export const READINESS_RATINGS = ["Needs Practice", "Developing", "Solid", "Strong"] as const;

// Free-tier guardrails: cap prompt-injected user text so a pasted novel
// can't blow up token usage.
export const MAX_JOB_DESCRIPTION_CHARS = 2000;
export const MAX_CODE_CHARS = 4000;
export const MAX_TEXT_ANSWER_CHARS = 8000;
