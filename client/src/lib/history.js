const STORAGE_KEY = "genai_interview_sessions";
const MAX_SESSIONS = 20;

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveSession(session) {
  const all = loadHistory();
  all.unshift(session);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_SESSIONS)));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
