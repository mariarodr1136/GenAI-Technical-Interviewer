import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 8080),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  groqApiKey: process.env.GROQ_API_KEY,
  sttModel: process.env.GROQ_STT_MODEL ?? "whisper-large-v3",
  llmModel: process.env.GROQ_LLM_MODEL ?? "llama-3.3-70b-versatile"
};

export function validateEnv() {
  if (!env.groqApiKey || env.groqApiKey === "gsk_your_key_here") {
    throw new Error("Missing GROQ_API_KEY. Add it to server/.env before starting the server.");
  }
}
