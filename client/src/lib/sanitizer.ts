// Mirrors the server-side banned-word guard so words never flash on screen
// (or get spoken aloud) while a reply is still streaming — the server only
// sanitizes the final reply.
const bannedWordReplacements: Array<[RegExp, string]> = [
  [/\bscalable\b/gi, "able to handle growth"],
  [/\bsecure\b/gi, "protected"],
  [/\brobust\b/gi, "reliable"]
];

export function sanitizeText(text: string): string {
  return bannedWordReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text
  );
}
