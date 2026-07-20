import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeEditor } from "../src/components/CodeEditor.tsx";

// Simulate CodeMirror failing to start (as it does in jsdom) so the
// textarea fallback path is what gets exercised.
vi.mock("../src/lib/editor.ts", () => ({
  createCodeEditor: () => {
    throw new Error("CodeMirror unavailable");
  }
}));

const baseProps = {
  value: "",
  language: "javascript" as const,
  disabled: false,
  placeholder: "// code here",
  ariaLabel: "Code editor",
  onChange: vi.fn()
};

afterEach(cleanup);

describe("CodeEditor fallback", () => {
  it("keeps a usable textarea when CodeMirror cannot load", async () => {
    const onChange = vi.fn();
    render(<CodeEditor {...baseProps} onChange={onChange} />);

    const textarea = await screen.findByLabelText("Code editor");
    expect(textarea).toBeVisible();
    await userEvent.type(textarea, "x");
    expect(onChange).toHaveBeenCalledWith("x");
  });

  it("inserts two spaces on Tab instead of moving focus", async () => {
    const onChange = vi.fn();
    render(<CodeEditor {...baseProps} onChange={onChange} />);

    const textarea = await screen.findByLabelText("Code editor");
    await userEvent.click(textarea);
    await userEvent.keyboard("{Tab}");
    expect(onChange).toHaveBeenCalledWith("  ");
  });

  it("disables the fallback while a turn is processing", async () => {
    render(<CodeEditor {...baseProps} disabled />);
    expect(await screen.findByLabelText("Code editor")).toBeDisabled();
  });
});
