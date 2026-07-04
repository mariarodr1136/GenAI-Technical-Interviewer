const bannedWordReplacements: Array<[RegExp, string]> = [
  [/\bscalable\b/gi, "able to handle growth"],
  [/\bsecure\b/gi, "protected"],
  [/\brobust\b/gi, "reliable"]
];

/**
 * Reasoning models (e.g. Qwen3.6) can emit <think>…</think> blocks. We disable
 * reasoning via the API, but strip any that slip through — including an
 * unterminated block from a response truncated mid-thought.
 */
function stripThinkBlocks(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<think>[\s\S]*/g, "")
    .trim();
}

export function sanitizeInterviewResponse(text: string | null | undefined): string {
  return bannedWordReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    stripThinkBlocks(text ?? "")
  );
}
