export async function consumeSSE(response, { onTranscript, onDelta, onDone } = {}) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamError = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.transcript !== undefined) onTranscript?.(data.transcript);
          if (data.delta !== undefined) onDelta?.(data.delta);
          if (data.error !== undefined) { streamError = data.error; break; }
          if (data.done) onDone?.(data.reply);
        } catch {
          // Ignore malformed SSE events.
        }
      }

      if (streamError) break;
    }
  } finally {
    reader.releaseLock();
  }

  if (streamError) throw new Error(streamError);
}
