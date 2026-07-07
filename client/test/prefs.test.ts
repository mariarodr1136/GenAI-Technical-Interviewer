import { beforeEach, describe, expect, it } from "vitest";
import { loadPrefs, savePrefs } from "../src/lib/prefs.ts";

describe("prefs", () => {
  beforeEach(() => localStorage.clear());

  it("returns defaults when nothing is stored", () => {
    const prefs = loadPrefs();
    expect(prefs.topic).toBe("general");
    expect(prefs.difficulty).toBe("medium");
    expect(prefs.handsFree).toBe(false);
    expect(prefs.resume).toBe("");
    expect(prefs.codeLanguage).toBe("javascript");
  });

  it("round-trips saved preferences", () => {
    const prefs = loadPrefs();
    savePrefs({ ...prefs, topic: "system-design", handsFree: true, resume: "My resume" });
    const loaded = loadPrefs();
    expect(loaded.topic).toBe("system-design");
    expect(loaded.handsFree).toBe(true);
    expect(loaded.resume).toBe("My resume");
  });

  it("fills missing fields from defaults for prefs saved by older versions", () => {
    localStorage.setItem("genai_prefs", JSON.stringify({ topic: "backend" }));
    const prefs = loadPrefs();
    expect(prefs.topic).toBe("backend");
    expect(prefs.handsFree).toBe(false);
    expect(prefs.codeLanguage).toBe("javascript");
  });

  it("migrates legacy voice and dark-mode keys", () => {
    localStorage.setItem("genai_voice", "some-voice");
    localStorage.setItem("genai_dark_mode", "true");
    const prefs = loadPrefs();
    expect(prefs.voiceURI).toBe("some-voice");
    expect(prefs.darkMode).toBe(true);
  });

  it("survives corrupted storage", () => {
    localStorage.setItem("genai_prefs", "{not json");
    expect(loadPrefs().topic).toBe("general");
  });
});
