import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DebriefModal } from "../src/components/DebriefModal.tsx";
import type { SavedSession } from "../src/types.ts";

const session: SavedSession = {
  id: 1,
  date: "2026-07-06T15:30:00.000Z",
  topic: "algorithms",
  difficulty: "medium",
  persona: "professional",
  turnCount: 4,
  conversation: [{ role: "assistant", content: "Question?" }],
  debrief: {
    turnCount: 4,
    topicsCovered: ["arrays", "recursion"],
    strengths: "Explains trade-offs well.",
    areasToImprove: "Big-O analysis.",
    readinessRating: "Developing",
    closingNote: "Solid progress."
  }
};

afterEach(cleanup);

describe("DebriefModal", () => {
  it("renders the rating, sections, and topics", () => {
    render(<DebriefModal session={session} onClose={() => {}} />);
    expect(screen.getByText("Developing")).toBeInTheDocument();
    expect(screen.getByText("Explains trade-offs well.")).toBeInTheDocument();
    expect(screen.getByText("Big-O analysis.")).toBeInTheDocument();
    expect(screen.getByText("arrays")).toBeInTheDocument();
    expect(screen.getByText("Solid progress.")).toBeInTheDocument();
  });

  it("closes via the primary button", async () => {
    const onClose = vi.fn();
    render(<DebriefModal session={session} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /start new session/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("downloads a markdown report", async () => {
    const createObjectURL = vi.fn((_blob: Blob) => "blob:fake");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<DebriefModal session={session} onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Download Report" }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("text/markdown");
    expect(clickSpy).toHaveBeenCalledOnce();

    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
