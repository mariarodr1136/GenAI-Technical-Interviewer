import { describe, expect, it, vi } from "vitest";
import { consumeSSE } from "../src/lib/stream.ts";

function sseResponse(events: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const event of events) controller.enqueue(encoder.encode(event));
      controller.close();
    }
  });
  return new Response(body);
}

describe("consumeSSE", () => {
  it("dispatches transcript, deltas, and done", async () => {
    const onTranscript = vi.fn();
    const onDelta = vi.fn();
    const onDone = vi.fn();

    await consumeSSE(
      sseResponse([
        'data: {"transcript":"I would use a queue."}\n\n',
        'data: {"delta":"Good"}\n\n',
        'data: {"delta":" answer."}\n\n',
        'data: {"done":true,"reply":"Good answer."}\n\n'
      ]),
      { onTranscript, onDelta, onDone }
    );

    expect(onTranscript).toHaveBeenCalledWith("I would use a queue.");
    expect(onDelta).toHaveBeenNthCalledWith(1, "Good");
    expect(onDelta).toHaveBeenNthCalledWith(2, " answer.");
    expect(onDone).toHaveBeenCalledWith("Good answer.");
  });

  it("handles events split across chunks", async () => {
    const onDelta = vi.fn();
    await consumeSSE(sseResponse(['data: {"del', 'ta":"partial"}\n\n']), { onDelta });
    expect(onDelta).toHaveBeenCalledWith("partial");
  });

  it("throws when the stream carries an error event", async () => {
    await expect(
      consumeSSE(sseResponse(['data: {"error":"Rate limited."}\n\n']))
    ).rejects.toThrowError("Rate limited.");
  });

  it("ignores malformed events and non-data lines", async () => {
    const onDone = vi.fn();
    await consumeSSE(
      sseResponse(["data: not-json\n\n", ": comment\n\n", 'data: {"done":true,"reply":"ok"}\n\n']),
      { onDone }
    );
    expect(onDone).toHaveBeenCalledWith("ok");
  });

  it("throws when the response has no body", async () => {
    await expect(consumeSSE(new Response(null))).rejects.toThrowError(/no body/);
  });
});
