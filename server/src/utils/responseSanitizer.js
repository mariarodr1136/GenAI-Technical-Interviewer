const bannedWordReplacements = [
  [/\\bscalable\\b/gi, "able to handle growth"],
  [/\\bsecure\\b/gi, "protected"],
  [/\\brobust\\b/gi, "reliable"]
];

export function sanitizeInterviewResponse(text) {
  return bannedWordReplacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text ?? ""
  );
}
