import fs from "node:fs";
import type { Response } from "express";
import Groq from "groq-sdk";
import { env } from "../config/env.ts";
import { buildInterviewerPrompt } from "../prompts/interviewerPrompt.ts";
import type { ChatMessage, Debrief, InterviewOptions } from "../types.ts";
import { sanitizeInterviewResponse } from "../utils/responseSanitizer.ts";
import { parseDebrief } from "../utils/validate.ts";

// Lazy so importing this module (e.g. in tests) never requires an API key.
let client: Groq | null = null;
function getGroq(): Groq {
  client ??= new Groq({
    apiKey: env.groqApiKey,
    timeout: 45_000, // fail fast instead of hanging a free-tier dyno
    maxRetries: 2 // SDK retries 408/429/5xx and connection errors with backoff
  });
  return client;
}

type ReplyStream = AsyncIterable<Groq.Chat.ChatCompletionChunk>;

// Disables <think> output on reasoning models (empty env value omits the param).
const reasoningEffort = (env.reasoningEffort || undefined) as
  "none" | "default" | "low" | "medium" | "high" | undefined;

export async function transcribeAudio(filePath: string): Promise<string> {
  const transcription = await getGroq().audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: env.sttModel,
    response_format: "json",
    language: "en",
    temperature: 0
  });
  return transcription.text?.trim() ?? "";
}

export function buildUserTurnContent(transcript: string, code?: string, topic?: string): string {
  const parts = ["Candidate response transcript:", transcript];
  if (code) {
    const label = topic === "system-design" ? "Candidate's design notes:" : "Candidate's code:";
    parts.push("", label, "```", code, "```");
  }
  parts.push(
    "",
    "Respond as the interviewer. Ask one next question or give a concise evaluation and follow-up."
  );
  return parts.join("\n");
}

export async function createReplyStream(
  transcript: string,
  history: ChatMessage[] = [],
  options: Partial<InterviewOptions> = {},
  code?: string,
  signal?: AbortSignal
): Promise<ReplyStream> {
  return getGroq().chat.completions.create(
    {
      model: env.llmModel,
      reasoning_effort: reasoningEffort,
      messages: [
        { role: "system", content: buildInterviewerPrompt(options) },
        ...history,
        { role: "user", content: buildUserTurnContent(transcript, code, options.topic) }
      ],
      temperature: 0.55,
      max_completion_tokens: code ? 260 : 180,
      stream: true
    },
    { signal }
  ) as Promise<ReplyStream>;
}

export async function pipeStreamToSSE(stream: ReplyStream, res: Response): Promise<void> {
  let fullText = "";
  for await (const chunk of stream) {
    if (res.writableEnded || res.destroyed) return;
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }
  if (res.writableEnded || res.destroyed) return;
  if (!fullText) throw new Error("Groq returned an empty response.");
  const reply = sanitizeInterviewResponse(fullText);
  res.write(`data: ${JSON.stringify({ done: true, reply })}\n\n`);
  res.end();
}

export async function generateOpeningQuestion(
  options: Partial<InterviewOptions> = {},
  signal?: AbortSignal
): Promise<string> {
  const completion = await getGroq().chat.completions.create(
    {
      model: env.llmModel,
      reasoning_effort: reasoningEffort,
      messages: [
        { role: "system", content: buildInterviewerPrompt(options) },
        {
          role: "user",
          content:
            "The interview is starting now. Greet the candidate briefly in one sentence and immediately ask your first interview question."
        }
      ],
      temperature: 0.6,
      max_completion_tokens: 120
    },
    { signal }
  );
  const question = completion.choices[0]?.message?.content?.trim();
  if (!question) throw new Error("Groq returned an empty opening question.");
  return sanitizeInterviewResponse(question);
}

export async function generateHint(history: ChatMessage[] = []): Promise<string> {
  const completion = await getGroq().chat.completions.create({
    model: env.llmModel,
    reasoning_effort: reasoningEffort,
    messages: [
      {
        role: "system",
        content:
          "You are a technical interviewer. The candidate has asked for a hint on the current question. Give ONE concrete hint in a single sentence — nudge them toward the answer without giving it away. Be specific and direct."
      },
      ...history,
      { role: "user", content: "Can I get a hint?" }
    ],
    temperature: 0.4,
    max_completion_tokens: 60
  });
  const hint = completion.choices[0]?.message?.content?.trim();
  if (!hint) throw new Error("Groq returned an empty hint.");
  return hint;
}

const DEBRIEF_SYSTEM_PROMPT = `
You are an engineering manager reviewing a completed technical interview. Analyze the conversation and return a JSON object with exactly this structure:
{
  "turnCount": <number of candidate turns as an integer>,
  "topicsCovered": [<array of short topic strings, max 5>],
  "strengths": "<1-3 sentences on what the candidate did well>",
  "areasToImprove": "<1-3 sentences on where the candidate should focus practice>",
  "readinessRating": "<exactly one of: Needs Practice, Developing, Solid, Strong>",
  "closingNote": "<one encouraging sentence to close the session>"
}
If the session was behavioral, comment specifically on the candidate's STAR structure (Situation, Task, Action, Result) in strengths and areasToImprove.
Return only valid JSON. No markdown fences, no explanation outside the JSON object.
`.trim();

export async function generateDebriefSummary(history: ChatMessage[] = []): Promise<Debrief> {
  const completion = await getGroq().chat.completions.create({
    model: env.llmModel,
    reasoning_effort: reasoningEffort,
    messages: [
      { role: "system", content: DEBRIEF_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: "Provide a structured debrief of this interview session." }
    ],
    temperature: 0.4,
    max_completion_tokens: 400,
    response_format: { type: "json_object" }
  });
  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Groq returned an empty debrief.");
  return parseDebrief(raw);
}
