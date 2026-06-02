import { unlink } from "node:fs/promises";
import {
  createReplyStream,
  generateDebriefSummary,
  generateHint,
  generateOpeningQuestion,
  pipeStreamToSSE,
  transcribeAudio
} from "../services/groqService.js";

function sseHeaders(res) {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

export async function handleInterviewTurn(req, res, next) {
  if (!req.file) {
    res.status(400).json({ error: "No audio file was uploaded." });
    return;
  }

  let transcript;
  try {
    transcript = await transcribeAudio(req.file.path);
  } catch (err) {
    await removeUploadedFile(req.file.path);
    next(err);
    return;
  }

  await removeUploadedFile(req.file.path);

  if (!transcript) {
    res.status(422).json({ error: "No speech was detected. Try recording a longer answer." });
    return;
  }

  sseHeaders(res);
  res.write(`data: ${JSON.stringify({ transcript })}\n\n`);

  const history = parseConversationHistory(req.body.history);
  const { topic, difficulty, persona } = req.body;

  try {
    const stream = await createReplyStream(transcript, history, { topic, difficulty, persona });
    await pipeStreamToSSE(stream, res);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

export async function handleTextTurn(req, res, next) {
  const { text, history: rawHistory, topic, difficulty, persona } = req.body;
  if (!text?.trim()) {
    res.status(400).json({ error: "No text was provided." });
    return;
  }

  const transcript = text.trim();
  sseHeaders(res);
  res.write(`data: ${JSON.stringify({ transcript })}\n\n`);

  try {
    const history = parseConversationHistory(rawHistory);
    const stream = await createReplyStream(transcript, history, { topic, difficulty, persona });
    await pipeStreamToSSE(stream, res);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

export async function handleStart(req, res, next) {
  const { topic, difficulty, persona } = req.body;
  try {
    const question = await generateOpeningQuestion(topic, difficulty, persona);
    res.json({ question });
  } catch (err) {
    next(err);
  }
}

export async function handleHint(req, res, next) {
  const { history: rawHistory } = req.body;
  const history = parseConversationHistory(rawHistory, 20);
  if (history.length === 0) {
    res.status(400).json({ error: "No conversation to base a hint on." });
    return;
  }
  try {
    const hint = await generateHint(history);
    res.json({ hint });
  } catch (err) {
    next(err);
  }
}

export async function handleDebrief(req, res, next) {
  const { history: rawHistory } = req.body;
  const history = parseConversationHistory(rawHistory, 40);
  if (history.length === 0) {
    res.status(400).json({ error: "No conversation history to debrief." });
    return;
  }
  try {
    const debrief = await generateDebriefSummary(history);
    res.json(debrief);
  } catch (err) {
    next(err);
  }
}

function parseConversationHistory(rawHistory, limit = 10) {
  if (!rawHistory) return [];
  try {
    const parsed = JSON.parse(rawHistory);
    if (!Array.isArray(parsed)) return [];

    const messages = parsed
      .filter((m) => ["user", "assistant"].includes(m?.role))
      .filter((m) => typeof m.content === "string" && m.content.trim())
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

async function removeUploadedFile(filePath) {
  try {
    await unlink(filePath);
  } catch {
    // Cleanup failure should not affect the API response.
  }
}
