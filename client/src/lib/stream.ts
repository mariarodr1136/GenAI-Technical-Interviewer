export interface SSECallbacks {
  onTranscript?: (transcript: string) => void;
  onDelta?: (delta: string) => void;
  onDone?: (reply: string) => void;
}

export async function consumeSSE(
  response: Response,
  { onTranscript, onDelta, onDone }: SSECallbacks = {}
): Promise<void> {
  if (!response.body) throw new Error("The server response had no body.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamError: string | null = null;

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
          const data = JSON.parse(line.slice(6)) as {
            transcript?: string;
            delta?: string;
            error?: string;
            done?: boolean;
            reply?: string;
          };
          if (data.transcript !== undefined) onTranscript?.(data.transcript);
          if (data.delta !== undefined) onDelta?.(data.delta);
          if (data.error !== undefined) {
            streamError = data.error;
            break;
          }
          if (data.done) onDone?.(data.reply ?? "");
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
