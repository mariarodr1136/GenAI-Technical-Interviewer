export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface InterviewOptions {
  topic: string;
  difficulty: string;
  persona: string;
  jobDescription?: string;
}

export interface Debrief {
  turnCount: number;
  topicsCovered: string[];
  strengths: string;
  areasToImprove: string;
  readinessRating: "Needs Practice" | "Developing" | "Solid" | "Strong";
  closingNote: string;
}
