import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ControlPanel } from "../src/components/ControlPanel.tsx";

// CodeMirror needs real DOM measurement APIs jsdom lacks; the component's own
// fallback behavior is covered in CodeEditor.test.tsx.
vi.mock("../src/components/CodeEditor.tsx", () => ({
  CodeEditor: (props: {
    value: string;
    placeholder: string;
    ariaLabel: string;
    disabled: boolean;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label={props.ariaLabel}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      disabled={props.disabled}
    />
  )
}));

const baseProps = {
  hasMicAccess: true,
  isRecording: false,
  isProcessing: false,
  isSpeaking: false,
  isSlowRequest: false,
  isLoadingDebrief: false,
  sessionStarted: false,
  hasAnswers: false,
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
  onReset: vi.fn(),
  onDiscard: vi.fn(),
  onCollapsePanel: vi.fn()
};

afterEach(cleanup);

describe("ControlPanel", () => {
  it("shows Begin Interview before the session starts", () => {
    render(<ControlPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: /begin interview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /get hint/i })).not.toBeInTheDocument();
  });

  it("offers the hint button once the session is running", () => {
    render(<ControlPanel {...baseProps} sessionStarted hasAnswers />);
    expect(screen.getByRole("button", { name: /get hint/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /end & debrief/i })).toBeInTheDocument();
  });

  // A debrief reviews answers, so a session ended before the first answer
  // promises only to end — App skips the debrief request in that case.
  it("offers a plain end when the first question is unanswered", () => {
    render(<ControlPanel {...baseProps} sessionStarted />);
    expect(screen.getByRole("button", { name: /end interview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /debrief/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /discard/i })).not.toBeInTheDocument();
  });

  it("discards an answered session without debriefing it", async () => {
    const onDiscard = vi.fn();
    const onReset = vi.fn();
    render(
      <ControlPanel
        {...baseProps}
        sessionStarted
        hasAnswers
        onDiscard={onDiscard}
        onReset={onReset}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /discard & restart/i }));
    expect(onDiscard).toHaveBeenCalledOnce();
    expect(onReset).not.toHaveBeenCalled();
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
