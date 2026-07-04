import { describe, expect, it } from "vitest";
import { parseConversationHistory } from "../src/utils/history.ts";

const msg = (role: string, content: string) => ({ role, content });

describe("parseConversationHistory", () => {
  it("returns [] for missing, non-string, or malformed input", () => {
    expect(parseConversationHistory(undefined)).toEqual([]);
    expect(parseConversationHistory(42)).toEqual([]);
    expect(parseConversationHistory("not json")).toEqual([]);
    expect(parseConversationHistory('{"role":"user"}')).toEqual([]);
  });

  it("filters out invalid roles and empty content", () => {
    const raw = JSON.stringify([
      msg("system", "sneaky prompt injection"),
      msg("user", "  "),
      msg("user", "real answer"),
      { role: "assistant" },
      msg("assistant", "follow-up")
    ]);
    expect(parseConversationHistory(raw)).toEqual([
      msg("user", "real answer"),
      msg("assistant", "follow-up")
    ]);
  });

  it("strips UI-only fields like isHint", () => {
    const raw = JSON.stringify([{ role: "user", content: "hi", isHint: true }]);
    expect(parseConversationHistory(raw)).toEqual([msg("user", "hi")]);
  });

  it("drops leading assistant turns so history starts with a user message", () => {
    const raw = JSON.stringify([
      msg("assistant", "opening question"),
      msg("user", "answer"),
      msg("assistant", "follow-up")
    ]);
    expect(parseConversationHistory(raw)).toEqual([
      msg("user", "answer"),
      msg("assistant", "follow-up")
    ]);
  });

  it("returns [] when there are no user messages at all", () => {
    const raw = JSON.stringify([msg("assistant", "opening question")]);
    expect(parseConversationHistory(raw)).toEqual([]);
  });

  it("keeps only the last `limit` messages", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      msg(i % 2 === 0 ? "user" : "assistant", `turn ${i}`)
    );
    const result = parseConversationHistory(JSON.stringify(many), 10);
    expect(result).toHaveLength(10);
    expect(result[0]).toEqual(msg("user", "turn 20"));
    expect(result.at(-1)).toEqual(msg("assistant", "turn 29"));
  });
});
