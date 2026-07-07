import { describe, expect, it } from "vitest";
import { toApiHistory } from "../src/lib/api.ts";
import type { ChatMessage } from "../src/types.ts";

describe("toApiHistory", () => {
  it("keeps only role and content", () => {
    const history = toApiHistory([
      { role: "assistant", content: "Question?", isHint: true } as ChatMessage
    ]);
    expect(history).toEqual([{ role: "assistant", content: "Question?" }]);
  });

  it("folds attached code into the message content", () => {
    const [message] = toApiHistory([
      { role: "user", content: "Here it is.", code: "const x = 1;" }
    ]);
    expect(message.content).toContain("Here it is.");
    expect(message.content).toContain("const x = 1;");
    expect(message.content).toContain("```");
  });

  it("caps the history at the 20 most recent messages", () => {
    const long: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
      role: "user",
      content: `message ${i}`
    }));
    const history = toApiHistory(long);
    expect(history).toHaveLength(20);
    expect(history[0].content).toBe("message 10");
    expect(history[19].content).toBe("message 29");
  });
});
