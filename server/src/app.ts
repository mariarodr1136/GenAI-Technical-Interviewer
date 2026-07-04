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

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", sttModel: env.sttModel, llmModel: env.llmModel });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiLimiter);
  app.use("/api/interview", interviewRouter);
  app.use(errorHandler);

  return app;
}
