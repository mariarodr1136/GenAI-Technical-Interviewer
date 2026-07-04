import type { NextFunction, Request, Response } from "express";
import { friendlyError } from "../utils/friendlyError.ts";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(error);

  if (res.headersSent) {
    res.end();
    return;
  }

  if ((error as { code?: string })?.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "Audio file is too large. Keep recordings under 25 MB." });
    return;
  }

  const { status, message } = friendlyError(error);
  res.status(status).json({ error: message });
}
