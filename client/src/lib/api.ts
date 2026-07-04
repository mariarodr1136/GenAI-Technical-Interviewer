import { MAX_REQUEST_HISTORY } from "../constants.ts";
import type { ChatMessage, Debrief, InterviewConfig } from "../types.ts";
import { consumeSSE, type SSECallbacks } from "./stream.ts";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

/**
 * The API strips unknown fields from history messages, so attached code has
 * to be folded into the message content for the model to see it.
 */
export function toApiHistory(
  conversation: ChatMessage[]
): Array<Pick<ChatMessage, "role" | "content">> {
  return conversation.slice(-MAX_REQUEST_HISTORY).map(({ role, content, code }) => ({
    role,
    content: code
      ? `${content}\n\nCode I submitted with this answer:\n\`\`\`\n${code}\n\`\`\``
      : content
  }));
}

async function errorFromResponse(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = (await response.json()) as { error?: string };
    return new Error(payload.error ?? fallback);
  } catch {
    return new Error(fallback);
  }
}

/** Fire-and-forget ping so the free-tier server starts waking up early. */
export function warmServer(): void {
  fetch(`${API_BASE_URL}/api/health`).catch(() => {});
}

export async function startInterview(
  config: InterviewConfig,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    signal
  });
  if (!response.ok) throw await errorFromResponse(response, "Could not start interview.");
  const payload = (await response.json()) as { question: string };
  return payload.question;
}

export interface TurnPayload {
  conversation: ChatMessage[];
  config: InterviewConfig;
  code?: string;
}

export async function streamAudioTurn(
  audioBlob: Blob,
  fileName: string,
  { conversation, config, code }: TurnPayload,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  formData.append("audio", audioBlob, fileName);
  formData.append("history", JSON.stringify(toApiHistory(conversation)));
  formData.append("topic", config.topic);
  formData.append("difficulty", config.difficulty);
  formData.append("persona", config.persona);
  if (config.jobDescription) formData.append("jobDescription", config.jobDescription);
  if (code) formData.append("code", code);

  const response = await fetch(`${API_BASE_URL}/api/interview/turn`, {
    method: "POST",
    body: formData,
    signal
  });
  if (!response.ok)
    throw await errorFromResponse(response, "The server could not process the audio.");
  await consumeSSE(response, callbacks);
}

export async function streamTextTurn(
  text: string,
  { conversation, config, code }: TurnPayload,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/interview/text-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      history: JSON.stringify(toApiHistory(conversation)),
      topic: config.topic,
      difficulty: config.difficulty,
      persona: config.persona,
      jobDescription: config.jobDescription || undefined,
      code: code || undefined
    }),
    signal
  });
  if (!response.ok)
    throw await errorFromResponse(response, "The server could not process the text.");
  await consumeSSE(response, callbacks);
}

export async function fetchHint(conversation: ChatMessage[]): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/interview/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history: JSON.stringify(toApiHistory(conversation)) })
  });
  if (!response.ok) throw await errorFromResponse(response, "Could not get hint.");
  const payload = (await response.json()) as { hint: string };
  return payload.hint;
}

export async function fetchDebrief(conversation: ChatMessage[]): Promise<Debrief> {
  const response = await fetch(`${API_BASE_URL}/api/interview/debrief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The debrief reviews the whole session (the server caps how much it reads).
    body: JSON.stringify({
      history: JSON.stringify(conversation.map(({ role, content }) => ({ role, content })))
    })
  });
  if (!response.ok) throw await errorFromResponse(response, "Could not generate debrief.");
  return (await response.json()) as Debrief;
}
