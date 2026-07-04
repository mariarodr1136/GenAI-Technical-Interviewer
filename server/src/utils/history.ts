import type { ChatMessage } from "../types.ts";

export function parseConversationHistory(rawHistory: unknown, limit = 10): ChatMessage[] {
  if (!rawHistory || typeof rawHistory !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(rawHistory);
    if (!Array.isArray(parsed)) return [];

    const messages: ChatMessage[] = parsed
      .filter(
        (m): m is ChatMessage =>
          m !== null &&
          typeof m === "object" &&
          ["user", "assistant"].includes((m as { role?: unknown }).role as string) &&
          typeof (m as { content?: unknown }).content === "string" &&
          (m as { content: string }).content.trim().length > 0
      )
      .slice(-limit)
      .map(({ role, content }) => ({ role, content })); // strip UI-only fields like isHint

    // Groq (and OpenAI-compatible APIs) require the first non-system message
    // to be a user message. The "Begin Interview" flow produces a history that
    // starts with an assistant message, so we drop any leading assistant turns.
    const firstUserIdx = messages.findIndex((m) => m.role === "user");
    if (firstUserIdx === -1) return [];
    return firstUserIdx > 0 ? messages.slice(firstUserIdx) : messages;
  } catch {
    return [];
  }
}
