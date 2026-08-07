import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createCompletion } = vi.hoisted(() => ({ createCompletion: vi.fn() }));

vi.mock("groq-sdk", () => {
  class APIError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  }
  class MockGroq {
    static APIError = APIError;
    static APIConnectionError = class extends APIError {};
    static APIConnectionTimeoutError = class extends APIError {};
    chat = { completions: { create: createCompletion } };
    audio = { transcriptions: { create: vi.fn() } };
  }
  return { default: MockGroq };
});

// Set before app.ts pulls in env.ts, which reads this once at import time.
process.env.DAILY_API_BUDGET = "2";
const { createApp } = await import("../src/app.ts");
const app = createApp();

describe("daily API budget", () => {
  beforeEach(() => {
    createCompletion.mockReset();
    createCompletion.mockResolvedValue({ choices: [{ message: { content: "A question?" } }] });
  });

  it("spends across all visitors, not per IP, and then refuses with advice", async () => {
    // Different addresses, one shared budget.
    await request(app).post("/api/interview/start").set("X-Forwarded-For", "1.1.1.1").expect(200);
    await request(app).post("/api/interview/start").set("X-Forwarded-For", "2.2.2.2").expect(200);

    const spent = await request(app)
      .post("/api/interview/start")
      .set("X-Forwarded-For", "3.3.3.3")
      .expect(429);
    expect(spent.body.error).toMatch(/daily limit/i);
    expect(spent.body.error).toMatch(/tomorrow/i);

    // The AI was never called for the refused request.
    expect(createCompletion).toHaveBeenCalledTimes(2);
  });

  it("leaves the health check free so the landing page can still wake the server", async () => {
    await request(app).get("/api/health").expect(200);
  });
});
