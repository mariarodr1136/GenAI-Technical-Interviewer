import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import interviewRouter from "./routes/interviewRoutes.ts";

export function createApp(): express.Express {
  const app = express();

  // Render (and most PaaS hosts) terminate TLS at a proxy. Without this,
  // req.ip is the proxy's address and the rate limiter becomes one shared
  // bucket for every visitor.
  app.set("trust proxy", 1);

  app.use(cors({ origin: env.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please wait a few minutes before continuing." }
  });

  // A backstop across all visitors, not per IP. The real ceiling is the AI
  // provider's daily token budget, which a request count can only approximate:
  // a full interview is roughly 14 calls, so this lands a little above where
  // the token budget runs out. It exists so a scraper or a runaway client
  // meets a clear message instead of draining the key.
  const dailyBudget = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: env.dailyApiBudget,
    keyGenerator: () => "global",
    standardHeaders: false,
    legacyHeaders: false,
    // Deliberately not keyed on IP, so skip the IP-related checks.
    validate: { keyGeneratorIpFallback: false },
    message: {
      error:
        "This free practice server has hit its daily limit — a lot of people " +
        "have been interviewing today. Please come back tomorrow."
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", sttModel: env.sttModel, llmModel: env.llmModel });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiLimiter);
  // Only the AI-backed routes draw on the budget; /api/health stays free so the
  // landing page can still wake the server.
  app.use("/api/interview", dailyBudget, interviewRouter);
  app.use(errorHandler);

  return app;
}
