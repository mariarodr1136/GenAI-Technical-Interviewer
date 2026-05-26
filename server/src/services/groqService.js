import fs from "node:fs";
import Groq from "groq-sdk";
import { env } from "../config/env.js";
import { INTERVIEWER_SYSTEM_PROMPT } from "../prompts/interviewerPrompt.js";
import { sanitizeInterviewResponse } from "../utils/responseSanitizer.js";

const groq = new Groq({
  apiKey: env.groqApiKey
});

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

export async function generateInterviewerReply(transcript, history = []) {
  const completion = await groq.chat.completions.create({
    model: env.llmModel,
    messages: [
      {
        role: "system",
        content: INTERVIEWER_SYSTEM_PROMPT
      },
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
    max_completion_tokens: 180
  });

  const reply = completion.choices[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("Groq returned an empty interviewer response.");
  }

  return sanitizeInterviewResponse(reply);
}
