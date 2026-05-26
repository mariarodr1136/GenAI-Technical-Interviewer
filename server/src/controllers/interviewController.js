import { unlink } from "node:fs/promises";
import { generateInterviewerReply, transcribeAudio } from "../services/groqService.js";

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
    const reply = await generateInterviewerReply(transcript, history);

    res.json({
      transcript,
      reply
    });
  } catch (error) {
    next(error);
  } finally {
    await removeUploadedFile(req.file.path);
  }
}

function parseConversationHistory(rawHistory) {
  if (!rawHistory) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawHistory);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((message) => ["user", "assistant"].includes(message?.role))
      .filter((message) => typeof message.content === "string" && message.content.trim())
      .slice(-10);
  } catch {
    return [];
  }
}

async function removeUploadedFile(filePath) {
  try {
    await unlink(filePath);
  } catch {
    // The request already completed; cleanup failure should not change the API result.
  }
}
