import fs from "node:fs";
import Groq from "groq-sdk";
import { env } from "../config/env.js";
import { buildInterviewerPrompt } from "../prompts/interviewerPrompt.js";
import { sanitizeInterviewResponse } from "../utils/responseSanitizer.js";

const groq = new Groq({ apiKey: env.groqApiKey });

export async function transcribeAudio(filePath) {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: env.sttModel,
    response_format: "json",
    language: "en",
    temperature: 0
  });
  return transcription.text?.trim() ?? "";
}

export async function createReplyStream(
  transcript,
  history = [],
  { topic = "general", difficulty = "medium", persona = "professional" } = {}
) {
  return groq.chat.completions.create({
    model: env.llmModel,
    messages: [
      { role: "system", content: buildInterviewerPrompt(topic, difficulty, persona) },
      ...history,
      {
        role: "user",
        content: [
          "Candidate response transcript:",
          transcript,
          "",
          "Respond as the interviewer. Ask one next question or give a concise evaluation and follow-up."
        ].join("\n")
      }
    ],
    temperature: 0.55,
    max_completion_tokens: 180,
    stream: true
  });
}

export async function pipeStreamToSSE(stream, res) {
  let fullText = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullText += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }
  if (!fullText) throw new Error("Groq returned an empty response.");
  const reply = sanitizeInterviewResponse(fullText);
  res.write(`data: ${JSON.stringify({ done: true, reply })}\n\n`);
  res.end();
}

export async function generateOpeningQuestion(
  topic = "general",
  difficulty = "medium",
  persona = "professional"
) {
  const completion = await groq.chat.completions.create({
    model: env.llmModel,
    messages: [
      { role: "system", content: buildInterviewerPrompt(topic, difficulty, persona) },
      {
        role: "user",
        content:
          "The interview is starting now. Greet the candidate briefly in one sentence and immediately ask your first interview question."
      }
    ],
    temperature: 0.6,
    max_completion_tokens: 120
  });
  const question = completion.choices[0]?.message?.content?.trim();
  if (!question) throw new Error("Groq returned an empty opening question.");
  return sanitizeInterviewResponse(question);
}

export async function generateHint(history = []) {
  const completion = await groq.chat.completions.create({
    model: env.llmModel,
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
Return only valid JSON. No markdown fences, no explanation outside the JSON object.
`.trim();

export async function generateDebriefSummary(history = []) {
  const completion = await groq.chat.completions.create({
    model: env.llmModel,
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
  return JSON.parse(raw);
}
