export interface Prefs {
  topic: string;
  difficulty: string;
  persona: string;
  duration: number;
  autoStart: boolean;
  handsFree: boolean;
  voiceURI: string;
  darkMode: boolean;
  jobDescription: string;
  resume: string;
  codeLanguage: "javascript" | "python";
  /** Width of the controls panel in px, and whether it is collapsed away. */
  panelWidth: number;
  panelCollapsed: boolean;
}

const STORAGE_KEY = "genai_prefs";

const DEFAULTS: Prefs = {
  topic: "general",
  difficulty: "medium",
  persona: "professional",
  duration: 0,
  autoStart: false,
  handsFree: false,
  voiceURI: "",
  darkMode: false,
  jobDescription: "",
  resume: "",
  codeLanguage: "javascript",
  panelWidth: 300,
  panelCollapsed: false
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
