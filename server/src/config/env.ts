import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 8080),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  groqApiKey: process.env.GROQ_API_KEY,
  sttModel: process.env.GROQ_STT_MODEL ?? "whisper-large-v3",
  llmModel: process.env.GROQ_LLM_MODEL ?? "qwen/qwen3.6-27b",
  // Qwen3.6 is a reasoning model; "none" disables <think> output so replies are
  // fast and clean. Set GROQ_REASONING_EFFORT to "" for non-reasoning models.
  reasoningEffort: process.env.GROQ_REASONING_EFFORT ?? "none"
};

export function validateEnv(): void {
  if (!env.groqApiKey || env.groqApiKey === "gsk_your_key_here") {
    throw new Error("Missing GROQ_API_KEY. Add it to server/.env before starting the server.");
  }
}
