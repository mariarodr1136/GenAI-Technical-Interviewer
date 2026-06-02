import { unlink } from "node:fs/promises";
import {
  generateDebriefSummary,
  generateInterviewerReply,
  transcribeAudio
} from "../services/groqService.js";

export async function handleInterviewTurn(req, res, next) {
  if (!req.file) {
    res.status(400).json({ error: "No audio file was uploaded." });
    return;
  }

  try {
    const transcript = await transcribeAudio(req.file.path);

    if (!transcript) {
      res.status(422).json({ error: "No speech was detected. Try recording a longer answer." });
      return;
    }

    const history = parseConversationHistory(req.body.history);
    const { topic, difficulty } = req.body;
    const reply = await generateInterviewerReply(transcript, history, { topic, difficulty });

    res.json({ transcript, reply });
  } catch (error) {
    next(error);
  } finally {
    await removeUploadedFile(req.file.path);
  }
}

export async function handleTextTurn(req, res, next) {
  const { text, history: rawHistory, topic, difficulty } = req.body;

  if (!text?.trim()) {
    res.status(400).json({ error: "No text was provided." });
    return;
  }

  try {
    const history = parseConversationHistory(rawHistory);
    const reply = await generateInterviewerReply(text.trim(), history, { topic, difficulty });
    res.json({ transcript: text.trim(), reply });
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
  }
}

function parseConversationHistory(rawHistory, limit = 10) {
  if (!rawHistory) return [];

  try {
    const parsed = JSON.parse(rawHistory);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((m) => ["user", "assistant"].includes(m?.role))
      .filter((m) => typeof m.content === "string" && m.content.trim())
      .slice(-limit);
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
