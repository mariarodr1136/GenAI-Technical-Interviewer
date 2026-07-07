import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ControlPanel } from "../src/components/ControlPanel.tsx";

const baseProps = {
  hasMicAccess: true,
  isRecording: false,
  isProcessing: false,
  isSpeaking: false,
  isSlowRequest: false,
  isLoadingDebrief: false,
  sessionStarted: false,
  recordingSeconds: 0,
  audioLevel: 0,
  error: "",
  isMuted: false,
  textMode: false,
  codeMode: false,
  textInput: "",
  codeInput: "",
  designNotesMode: false,
  codeLanguage: "javascript" as const,
  runOutput: "",
  isRunningCode: false,
  onRequestMicrophone: vi.fn(),
  onStartRecording: vi.fn(),
  onStopRecording: vi.fn(),
  onToggleMute: vi.fn(),
  onToggleTextMode: vi.fn(),
  onToggleCodeMode: vi.fn(),
  onTextInputChange: vi.fn(),
  onCodeInputChange: vi.fn(),
  onCodeLanguageChange: vi.fn(),
  onRunCode: vi.fn(),
  onClearRunOutput: vi.fn(),
  onSubmitText: vi.fn(),
  onBeginInterview: vi.fn(),
  onRequestHint: vi.fn(),
  onStopGenerating: vi.fn(),
  onReset: vi.fn()
};

afterEach(cleanup);

describe("ControlPanel", () => {
  it("shows Begin Interview before the session starts", () => {
    render(<ControlPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: /begin interview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /get hint/i })).not.toBeInTheDocument();
  });

  it("offers the hint button once the session is running", () => {
    render(<ControlPanel {...baseProps} sessionStarted />);
    expect(screen.getByRole("button", { name: /get hint/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /end & debrief/i })).toBeInTheDocument();
  });

  it("shows a Run button with a language picker in code mode", async () => {
    const onRunCode = vi.fn();
    render(
      <ControlPanel {...baseProps} codeMode codeInput="console.log(1)" onRunCode={onRunCode} />
    );
    expect(screen.getByRole("combobox", { name: /code language/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^run$/i }));
    expect(onRunCode).toHaveBeenCalledOnce();
  });

  it("disables Run when the editor is empty", () => {
    render(<ControlPanel {...baseProps} codeMode codeInput="  " />);
    expect(screen.getByRole("button", { name: /^run$/i })).toBeDisabled();
  });

  it("shows run output with a clear control", async () => {
    const onClearRunOutput = vi.fn();
    render(
      <ControlPanel
        {...baseProps}
        codeMode
        codeInput="print(1)"
        runOutput="1"
        onClearRunOutput={onClearRunOutput}
      />
    );
    expect(screen.getByLabelText("Run output")).toHaveTextContent("1");
    await userEvent.click(screen.getByTitle("Clear output"));
    expect(onClearRunOutput).toHaveBeenCalledOnce();
  });

  it("switches to design-notes labels for system design", () => {
    render(<ControlPanel {...baseProps} designNotesMode codeMode codeInput="Client -> API" />);
    expect(screen.getByRole("button", { name: /hide design notes/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^run$/i })).not.toBeInTheDocument();
  });

  it("shows the streamed error message", () => {
    render(<ControlPanel {...baseProps} error="The AI service is busy." />);
    expect(screen.getByText("The AI service is busy.")).toBeInTheDocument();
  });
});
