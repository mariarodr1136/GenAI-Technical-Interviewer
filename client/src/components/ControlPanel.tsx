import {
  Code2,
  Keyboard,
  Lightbulb,
  Loader2,
  Mic,
  PenLine,
  Play,
  PlayCircle,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import { formatTime } from "../constants.ts";
import type { CodeLanguage } from "../types.ts";

interface ControlPanelProps {
  // status
  hasMicAccess: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isSlowRequest: boolean;
  isLoadingDebrief: boolean;
  sessionStarted: boolean;
  recordingSeconds: number;
  audioLevel: number;
  error: string;
  // modes
  isMuted: boolean;
  textMode: boolean;
  codeMode: boolean;
  textInput: string;
  codeInput: string;
  /** System-design topic: the attach panel collects design notes instead of runnable code. */
  designNotesMode: boolean;
  codeLanguage: CodeLanguage;
  runOutput: string;
  isRunningCode: boolean;
  // handlers
  onRequestMicrophone: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleMute: () => void;
  onToggleTextMode: () => void;
  onToggleCodeMode: () => void;
  onTextInputChange: (value: string) => void;
  onCodeInputChange: (value: string) => void;
  onCodeLanguageChange: (value: CodeLanguage) => void;
  onRunCode: () => void;
  onClearRunOutput: () => void;
  onSubmitText: () => void;
  onBeginInterview: () => void;
  onRequestHint: () => void;
  onStopGenerating: () => void;
  onReset: () => void;
}

export function ControlPanel(props: ControlPanelProps) {
  const {
    hasMicAccess,
    isRecording,
    isProcessing,
    isSpeaking,
    isSlowRequest,
    isLoadingDebrief,
    sessionStarted,
    recordingSeconds,
    audioLevel,
    error,
    isMuted,
    textMode,
    codeMode,
    textInput,
    codeInput,
    designNotesMode,
    codeLanguage,
    runOutput,
    isRunningCode
  } = props;

  const isActive = isRecording || isProcessing;

  const meterLabel = isRecording
    ? `Recording ${formatTime(recordingSeconds)}`
    : isProcessing
      ? "Thinking…"
      : isSpeaking
        ? "Speaking"
        : "Ready";

  const meterSub =
    isProcessing && isSlowRequest
      ? "Still working — the free-tier server may be waking up. The first request can take up to a minute."
      : isRecording
        ? "Answer the question, then stop the recording."
        : textMode
          ? "Type your answer below and submit."
          : sessionStarted
            ? "Start a turn when you are ready to answer."
            : "Click Begin Interview or Start to get your first question.";

  function handleCodeKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
    props.onCodeInputChange(next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = selectionStart + 2;
    });
  }

  return (
    <section className="control-panel" aria-label="Interview controls">
      <div className="meter">
        <span
          className={
            isRecording
              ? "pulse recording"
              : isProcessing
                ? "pulse processing"
                : isSpeaking
                  ? "pulse speaking"
                  : "pulse"
          }
        />
        <div>
          <p>{meterLabel}</p>
          <span>{meterSub}</span>
        </div>
      </div>

      {isRecording && (
        <div className="level-bar-wrap" aria-label="Microphone input level">
          <div className="level-bar">
            <div className="level-fill" style={{ width: `${audioLevel}%` }} />
          </div>
        </div>
      )}

      <div className="button-grid">
        <button
          type="button"
          onClick={props.onRequestMicrophone}
          disabled={hasMicAccess || isActive}
        >
          <Mic size={18} aria-hidden="true" />
          {hasMicAccess ? "Mic Ready" : "Allow Mic"}
        </button>

        {!isRecording ? (
          <button
            type="button"
            className="primary"
            onClick={props.onStartRecording}
            disabled={isProcessing || textMode}
          >
            {isProcessing ? (
              <Loader2 className="spin" size={18} aria-hidden="true" />
            ) : (
              <Mic size={18} aria-hidden="true" />
            )}
            Start
          </button>
        ) : (
          <button type="button" className="danger" onClick={props.onStopRecording}>
            <Square size={18} aria-hidden="true" />
            Stop
          </button>
        )}

        <button
          type="button"
          onClick={props.onToggleMute}
          title={isMuted ? "Turn voice on" : "Mute voice"}
        >
          {isMuted ? (
            <VolumeX size={18} aria-hidden="true" />
          ) : (
            <Volume2 size={18} aria-hidden="true" />
          )}
          {isMuted ? "Muted" : "Voice On"}
        </button>

        <button
          type="button"
          onClick={props.onToggleTextMode}
          disabled={isActive}
          title={textMode ? "Switch to voice" : "Switch to text"}
        >
          {textMode ? (
            <Mic size={18} aria-hidden="true" />
          ) : (
            <Keyboard size={18} aria-hidden="true" />
          )}
          {textMode ? "Voice" : "Type"}
        </button>
      </div>

      <button
        type="button"
        className={codeMode ? "code-toggle-btn active" : "code-toggle-btn"}
        onClick={props.onToggleCodeMode}
        title={
          designNotesMode
            ? "Attach design notes to your next answer"
            : "Attach code to your next answer"
        }
      >
        {designNotesMode ? (
          <PenLine size={16} aria-hidden="true" />
        ) : (
          <Code2 size={16} aria-hidden="true" />
        )}
        {codeMode
          ? designNotesMode
            ? "Hide Design Notes"
            : "Hide Code Editor"
          : designNotesMode
            ? "Attach Design Notes"
            : "Attach Code"}
        {!codeMode && codeInput.trim() && (
          <span className="code-attached-dot" aria-label="Attachment present" />
        )}
      </button>

      {codeMode && (
        <div className="code-panel">
          <textarea
            value={codeInput}
            onChange={(e) => props.onCodeInputChange(e.target.value)}
            onKeyDown={handleCodeKeyDown}
            placeholder={
              designNotesMode
                ? "Outline your architecture: components, data flow, storage choices, trade-offs.\nIt is sent along with your next answer."
                : "// Write or paste code here.\n// It is sent along with your next answer."
            }
            rows={8}
            spellCheck={false}
            disabled={isProcessing}
          />

          {!designNotesMode && (
            <div className="code-run-row">
              <label className="code-lang-wrap">
                <span className="visually-hidden">Language</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => props.onCodeLanguageChange(e.target.value as CodeLanguage)}
                  disabled={isRunningCode}
                  aria-label="Code language"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
              </label>
              <button
                type="button"
                className="run-btn"
                onClick={props.onRunCode}
                disabled={isRunningCode || !codeInput.trim()}
              >
                {isRunningCode ? (
                  <Loader2 className="spin" size={14} aria-hidden="true" />
                ) : (
                  <Play size={14} aria-hidden="true" />
                )}
                {isRunningCode ? "Running…" : "Run"}
              </button>
              {codeLanguage === "python" && !runOutput && !isRunningCode && (
                <span className="run-note">First Python run downloads the runtime (~10 MB).</span>
              )}
            </div>
          )}

          {runOutput && !designNotesMode && (
            <div className="run-output" aria-label="Run output">
              <div className="run-output-header">
                <span>Output</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={props.onClearRunOutput}
                  title="Clear output"
                >
                  <X size={13} />
                </button>
              </div>
              <pre>{runOutput}</pre>
            </div>
          )}

          <div className="code-panel-footer">
            <span>
              {codeInput.trim()
                ? runOutput && !designNotesMode
                  ? "Attachment and its output will be sent with your next answer."
                  : "Attachment will be sent with your next answer."
                : "Editor is empty."}
            </span>
            {codeInput.trim() && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => props.onCodeInputChange("")}
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {!sessionStarted && !isActive && (
        <button
          type="button"
          className="primary full-width begin-btn"
          onClick={props.onBeginInterview}
        >
          <PlayCircle size={18} aria-hidden="true" />
          Begin Interview
        </button>
      )}

      {isProcessing && (
        <button type="button" className="danger full-width" onClick={props.onStopGenerating}>
          <Square size={16} aria-hidden="true" />
          Stop Generating
        </button>
      )}

      {sessionStarted && !isActive && (
        <button
          type="button"
          className="hint-btn full-width"
          onClick={props.onRequestHint}
          disabled={isLoadingDebrief}
        >
          <Lightbulb size={18} aria-hidden="true" />
          Get Hint
        </button>
      )}

      {textMode && (
        <div className="text-input-area">
          <textarea
            value={textInput}
            onChange={(e) => props.onTextInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) props.onSubmitText();
            }}
            placeholder="Type your answer… (Ctrl+Enter to submit)"
            rows={4}
            disabled={isProcessing}
          />
          <button
            type="button"
            className="primary full-width"
            onClick={props.onSubmitText}
            disabled={isProcessing || !textInput.trim()}
          >
            {isProcessing ? (
              <Loader2 className="spin" size={18} aria-hidden="true" />
            ) : (
              <Zap size={18} aria-hidden="true" />
            )}
            Submit Answer
          </button>
        </div>
      )}

      <button
        type="button"
        className="reset-btn"
        onClick={props.onReset}
        disabled={isActive || isLoadingDebrief}
      >
        {isLoadingDebrief ? (
          <Loader2 className="spin" size={18} aria-hidden="true" />
        ) : (
          <RotateCcw size={18} aria-hidden="true" />
        )}
        {isLoadingDebrief ? "Generating debrief…" : sessionStarted ? "End & Debrief" : "Reset"}
      </button>

      {error && <p className="error">{error}</p>}

      <p className="kbd-hint">
        <kbd>Space</kbd> start/stop · <kbd>M</kbd> mute · <kbd>Esc</kbd> stop
      </p>
    </section>
  );
}
