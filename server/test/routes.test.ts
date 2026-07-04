import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createCompletion, createTranscription } = vi.hoisted(() => ({
  createCompletion: vi.fn(),
  createTranscription: vi.fn()
}));

vi.mock("groq-sdk", () => {
  class APIError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  }
  class APIConnectionError extends APIError {}
  class APIConnectionTimeoutError extends APIConnectionError {}

  class MockGroq {
    static APIError = APIError;
    static APIConnectionError = APIConnectionError;
    static APIConnectionTimeoutError = APIConnectionTimeoutError;
    chat = { completions: { create: createCompletion } };
    audio = { transcriptions: { create: createTranscription } };
  }

  return { default: MockGroq };
});

const { createApp } = await import("../src/app.ts");
const app = createApp();

function completionWith(content: string) {
  return { choices: [{ message: { content } }] };
}

async function* chunkStream(...deltas: string[]) {
  for (const delta of deltas) {
    yield { choices: [{ delta: { content: delta } }] };
  }
}

beforeEach(() => {
  createCompletion.mockReset();
  createTranscription.mockReset();
});

describe("GET /api/health", () => {
  it("responds ok", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/interview/start", () => {
  it("returns a sanitized opening question", async () => {
    createCompletion.mockResolvedValue(completionWith("Welcome! Design a scalable system."));
    const res = await request(app)
      .post("/api/interview/start")
      .send({ topic: "system-design", difficulty: "hard", persona: "strict" })
      .expect(200);
    expect(res.body.question).toBe("Welcome! Design a able to handle growth system.");
  });

  it("rejects an invalid topic with 400", async () => {
    const res = await request(app)
      .post("/api/interview/start")
      .send({ topic: "quantum" })
      .expect(400);
    expect(res.body.error).toMatch(/Invalid topic/);
    expect(createCompletion).not.toHaveBeenCalled();
  });

  it("passes the job description into the system prompt", async () => {
    createCompletion.mockResolvedValue(completionWith("Hello! First question."));
    await request(app)
      .post("/api/interview/start")
      .send({ jobDescription: "Acme Corp seeks a React engineer" })
      .expect(200);
    const [params] = createCompletion.mock.calls[0];
    expect(params.messages[0].content).toContain("Acme Corp seeks a React engineer");
  });

  it("maps Groq 429 errors to a friendly message", async () => {
    const Groq = (await import("groq-sdk")).default as unknown as {
      APIError: new (message: string, status?: number) => Error;
    };
    createCompletion.mockRejectedValue(new Groq.APIError("rate limited", 429));
    const res = await request(app).post("/api/interview/start").send({}).expect(429);
    expect(res.body.error).toMatch(/busy/);
  });
});

describe("POST /api/interview/text-turn", () => {
  it("streams transcript, deltas, and a sanitized final reply over SSE", async () => {
    createCompletion.mockResolvedValue(chunkStream("Good ", "answer. Make it robust."));
    const res = await request(app)
      .post("/api/interview/text-turn")
      .send({ text: "I would use a stack.", topic: "algorithms" })
      .expect(200)
      .expect("Content-Type", /text\/event-stream/);

    const events = res.text
      .split("\n\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.slice(6)));

    expect(events[0]).toEqual({ transcript: "I would use a stack." });
    expect(events.some((e) => e.delta === "Good ")).toBe(true);
    const done = events.find((e) => e.done);
    expect(done.reply).toBe("Good answer. Make it reliable.");
  });

  it("includes candidate code in the user message when provided", async () => {
    createCompletion.mockResolvedValue(chunkStream("Nice loop."));
    await request(app)
      .post("/api/interview/text-turn")
      .send({ text: "Here is my code.", code: "for (;;) {}" })
      .expect(200);
    const [params] = createCompletion.mock.calls[0];
    const userMessage = params.messages.at(-1);
    expect(userMessage.content).toContain("Candidate's code:");
    expect(userMessage.content).toContain("for (;;) {}");
  });

  it("rejects empty text with 400", async () => {
    const res = await request(app)
      .post("/api/interview/text-turn")
      .send({ text: "  " })
      .expect(400);
    expect(res.body.error).toMatch(/No text/);
  });

  it("emits an SSE error event when the stream fails mid-flight", async () => {
    createCompletion.mockRejectedValue(new Error("boom"));
    const res = await request(app)
      .post("/api/interview/text-turn")
      .send({ text: "hello" })
      .expect(200);
    const events = res.text
      .split("\n\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.slice(6)));
    expect(events.at(-1).error).toBeDefined();
  });
});

describe("POST /api/interview/hint", () => {
  it("returns 400 when there is no usable history", async () => {
    const res = await request(app).post("/api/interview/hint").send({ history: "[]" }).expect(400);
    expect(res.body.error).toMatch(/No conversation/);
  });

  it("returns a hint for valid history", async () => {
    createCompletion.mockResolvedValue(completionWith("Think about a stack."));
    const history = JSON.stringify([{ role: "user", content: "I am stuck." }]);
    const res = await request(app).post("/api/interview/hint").send({ history }).expect(200);
    expect(res.body.hint).toBe("Think about a stack.");
  });
});

describe("POST /api/interview/debrief", () => {
  const history = JSON.stringify([
    { role: "user", content: "I used a hash map." },
    { role: "assistant", content: "Good. What is the complexity?" }
  ]);

  it("returns a validated debrief", async () => {
    const debrief = {
      turnCount: 1,
      topicsCovered: ["hash maps"],
      strengths: "Clear approach.",
      areasToImprove: "Complexity depth.",
      readinessRating: "Developing",
      closingNote: "Keep practicing!"
    };
    createCompletion.mockResolvedValue(completionWith(JSON.stringify(debrief)));
    const res = await request(app).post("/api/interview/debrief").send({ history }).expect(200);
    expect(res.body).toEqual(debrief);
  });

  it("returns 502 when the model emits malformed debrief JSON", async () => {
    createCompletion.mockResolvedValue(completionWith('{"nope": true}'));
    const res = await request(app).post("/api/interview/debrief").send({ history }).expect(502);
    expect(res.body.error).toMatch(/debrief/i);
  });
});
