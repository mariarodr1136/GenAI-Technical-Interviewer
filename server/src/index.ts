import { createApp } from "./app.ts";
import { env, validateEnv } from "./config/env.ts";

validateEnv();

const app = createApp();

const server = app.listen(env.port, (error?: Error) => {
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

// Render sends SIGTERM on deploys; drain in-flight requests instead of
// dropping them mid-interview.
function shutdown(signal: string): void {
  console.log(`${signal} received — shutting down gracefully.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});
