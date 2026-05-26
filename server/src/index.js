import cors from "cors";
import express from "express";
import { env, validateEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import interviewRouter from "./routes/interviewRoutes.js";

validateEnv();

const app = express();

app.use(
  cors({
    origin: env.clientOrigin
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    sttModel: env.sttModel,
    llmModel: env.llmModel
  });
});

app.use("/api/interview", interviewRouter);
app.use(errorHandler);

const server = app.listen(env.port, (error) => {
  if (error) {
    console.error(`Interview server failed to start on port ${env.port}:`, error.message);
    process.exit(1);
  }

  console.log(`Interview server listening on http://localhost:${env.port}`);
});

server.on("error", (error) => {
  console.error(`Interview server failed to start on port ${env.port}:`, error.message);
  process.exit(1);
});
