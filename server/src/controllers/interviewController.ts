import { unlink } from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import {
  createReplyStream,
  generateDebriefSummary,
  generateHint,
  generateOpeningQuestion,
  pipeStreamToSSE,
  transcribeAudio
} from "../services/groqService.ts";
import { friendlyError } from "../utils/friendlyError.ts";
import { parseConversationHistory } from "../utils/history.ts";
import { parseCode, parseInterviewOptions } from "../utils/validate.ts";
import { MAX_TEXT_ANSWER_CHARS } from "../config/constants.ts";

function sseHeaders(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

// Abort upstream Groq work the moment the client disconnects, so a closed
// tab doesn't keep burning free-tier tokens.
function abortOnClientDisconnect(res: Response): AbortSignal {
  const controller = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) controller.abort();
  });
  return controller.signal;
}

async function streamReplyTurn(
  res: Response,
  transcript: string,
  body: Record<string, unknown>,
  signal: AbortSignal
): Promise<void> {
  try {
    const options = parseInterviewOptions(body);
    const code = parseCode(body.code);
    const history = parseConversationHistory(body.history);
    const stream = await createReplyStream(transcript, history, options, code, signal);
    await pipeStreamToSSE(stream, res);
  } catch (err) {
    if (signal.aborted || res.writableEnded || res.destroyed) {
      res.end();
      return;
    }
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: friendlyError(err).message })}\n\n`);
    res.end();
  }
}

export async function handleInterviewTurn(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No audio file was uploaded." });
    return;
  }

  let transcript: string;
  try {
    // Validate before the (slower) transcription step so bad requests fail fast.
    parseInterviewOptions(req.body);
    parseCode(req.body.code);
    transcript = await transcribeAudio(req.file.path);
  } finally {
    await removeUploadedFile(req.file.path);
  }

  if (!transcript) {
    res.status(422).json({ error: "No speech was detected. Try recording a longer answer." });
    return;
  }

  const signal = abortOnClientDisconnect(res);
  sseHeaders(res);
  res.write(`data: ${JSON.stringify({ transcript })}\n\n`);
  await streamReplyTurn(res, transcript, req.body, signal);
}

export async function handleTextTurn(
  req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const { text } = req.body as { text?: unknown };
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "No text was provided." });
    return;
  }

  parseInterviewOptions(req.body);
  parseCode(req.body.code);

  const transcript = text.trim().slice(0, MAX_TEXT_ANSWER_CHARS);
  const signal = abortOnClientDisconnect(res);
  sseHeaders(res);
  res.write(`data: ${JSON.stringify({ transcript })}\n\n`);
  await streamReplyTurn(res, transcript, req.body, signal);
}

export async function handleStart(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const options = parseInterviewOptions(req.body);
    const signal = abortOnClientDisconnect(res);
    const question = await generateOpeningQuestion(options, signal);
    res.json({ question });
  } catch (err) {
    next(err);
  }
}

export async function handleHint(req: Request, res: Response, next: NextFunction): Promise<void> {
  const history = parseConversationHistory(req.body?.history, 20);
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

export async function handleDebrief(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const history = parseConversationHistory(req.body?.history, 40);
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

async function removeUploadedFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // Cleanup failure should not affect the API response.
  }
}
