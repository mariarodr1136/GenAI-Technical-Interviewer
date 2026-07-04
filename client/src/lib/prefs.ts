export interface Prefs {
  topic: string;
  difficulty: string;
  persona: string;
  duration: number;
  autoStart: boolean;
  voiceURI: string;
  darkMode: boolean;
  jobDescription: string;
}

const STORAGE_KEY = "genai_prefs";

const DEFAULTS: Prefs = {
  topic: "general",
  difficulty: "medium",
  persona: "professional",
  duration: 0,
  autoStart: false,
  voiceURI: "",
  darkMode: false,
  jobDescription: ""
};

export function loadPrefs(): Prefs {
  let stored: Partial<Prefs> = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Prefs>;
  } catch {
    stored = {};
  }

  // Migrate the two settings that predate the unified prefs object.
  const legacyVoice = localStorage.getItem("genai_voice");
  const legacyDark = localStorage.getItem("genai_dark_mode");

  return {
    ...DEFAULTS,
    ...(legacyVoice !== null ? { voiceURI: legacyVoice } : {}),
    ...(legacyDark !== null ? { darkMode: legacyDark === "true" } : {}),
    ...stored
  };
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage full or unavailable — prefs just won't persist.
  }
}
