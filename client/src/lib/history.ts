import type { SavedSession } from "../types.ts";

const STORAGE_KEY = "genai_interview_sessions";
const MAX_SESSIONS = 20;

export function loadHistory(): SavedSession[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? (parsed as SavedSession[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: SavedSession): void {
  const all = loadHistory();
  all.unshift(session);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_SESSIONS)));
  } catch {
    // Quota exceeded — drop transcripts from the oldest half and retry once.
    const trimmed = all.slice(0, Math.ceil(MAX_SESSIONS / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up quietly; history is a convenience, not critical data.
    }
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
