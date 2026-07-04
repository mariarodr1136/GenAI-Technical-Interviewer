import type { ReadinessRating } from "./types.ts";

export const TOPICS = [
  { value: "general", label: "General" },
  { value: "algorithms", label: "Algorithms" },
  { value: "system-design", label: "System Design" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "behavioral", label: "Behavioral" }
] as const;

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
] as const;

export const PERSONAS = [
  { value: "professional", label: "Professional" },
  { value: "strict", label: "Strict" },
  { value: "encouraging", label: "Encouraging" },
  { value: "fast-paced", label: "Fast-paced" }
] as const;

export const DURATIONS = [
  { value: 0, label: "No timer" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" }
] as const;

export const RATING_COLOR: Record<ReadinessRating, string> = {
  "Needs Practice": "coral",
  Developing: "amber",
  Solid: "teal",
  Strong: "teal"
};

export const RATING_VALUE: Record<ReadinessRating, number> = {
  "Needs Practice": 1,
  Developing: 2,
  Solid: 3,
  Strong: 4
};

/** How many recent messages are sent to the API with each request. */
export const MAX_REQUEST_HISTORY = 20;

export function formatTime(totalSeconds: number): string {
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
