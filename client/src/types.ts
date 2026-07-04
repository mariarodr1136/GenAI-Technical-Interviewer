export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
  /** UI-only: message came from the hint button. */
  isHint?: boolean;
  /** UI-only: code the candidate attached to this turn. */
  code?: string;
}

export type ReadinessRating = "Needs Practice" | "Developing" | "Solid" | "Strong";

export interface Debrief {
  turnCount: number;
  topicsCovered: string[];
  strengths: string;
  areasToImprove: string;
  readinessRating: ReadinessRating;
  closingNote: string;
}

export interface SavedSession {
  id: number;
  date: string;
  topic: string;
  difficulty: string;
  persona: string;
  turnCount: number;
  conversation: ChatMessage[];
  debrief: Debrief;
}

export interface InterviewConfig {
  topic: string;
  difficulty: string;
  persona: string;
  jobDescription: string;
}
