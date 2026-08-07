import {
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  Code2,
  PanelLeftClose,
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
import { CodeEditor } from "./CodeEditor.tsx";

interface ControlPanelProps {
  // status
  hasMicAccess: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isSlowRequest: boolean;
  isLoadingDebrief: boolean;
  sessionStarted: boolean;
  /** A debrief reviews answers, so an unanswered session just ends. */
  hasAnswers: boolean;
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
  /** Clear the session without a debrief and without saving it. */
  onDiscard: () => void;
  /** Slide the panel away, leaving only the rail to bring it back. */
  onCollapsePanel: () => void;
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
    hasAnswers,
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

  const phase = isRecording
    ? "Recording"
    : isProcessing
      ? "Thinking"
      : isSpeaking
        ? "Speaking"
        : "Ready";

  const meterLabel = isRecording
    ? `Recording ${formatTime(recordingSeconds)}`
    : isProcessing
      ? "Thinking…"
      : isSpeaking
        ? "Speaking"
        : "Ready";

  const PhaseIcon = isRecording ? Mic : isProcessing ? Loader2 : isSpeaking ? Volume2 : CheckCircle;

  const meterSub =
    isProcessing && isSlowRequest
      ? "Still working — the free-tier server may be waking up. The first request can take up to a minute."
      : isRecording
        ? "Answer the question, then stop the recording."
        : textMode
          ? "Type your answer below and submit."
          : sessionStarted
            ? "Hit Record when you are ready to answer."
            : "Click Begin Interview for your first question, or Record to jump straight in.";

  return (
    <section className="control-panel" aria-label="Interview controls">
      {/* Announces phase changes only — the ticking timer stays visual. */}
      <p className="visually-hidden" role="status">
        {phase}
      </p>

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
          <p>
            <PhaseIcon size={14} className={isProcessing ? "spin" : undefined} aria-hidden="true" />
            {meterLabel}
          </p>
          <span>{meterSub}</span>
        </div>

        <button
          type="button"
          className="meter-collapse-btn"
          onClick={props.onCollapsePanel}
          aria-label="Hide the controls panel"
          title="Hide controls — widen the transcript"
        >
          <PanelLeftClose size={15} aria-hidden="true" />
        </button>
      </div>

      {isRecording && (
        <div
          className="level-bar-wrap"
          role="progressbar"
          aria-label="Microphone input level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(audioLevel)}
        >
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
            Record
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
          <>
            <span className="code-attached-dot" aria-hidden="true" />
            <span className="visually-hidden">Attachment present</span>
          </>
        )}
      </button>

      {codeMode && (
        <div className="code-panel">
          {designNotesMode ? (
            <textarea
              value={codeInput}
              onChange={(e) => props.onCodeInputChange(e.target.value)}
              placeholder={
                "Outline your architecture: components, data flow, storage choices, trade-offs.\nIt is sent along with your next answer."
              }
              aria-label="Design notes"
              rows={8}
              spellCheck={false}
              disabled={isProcessing}
            />
          ) : (
            <CodeEditor
              value={codeInput}
              language={codeLanguage}
              disabled={isProcessing}
              placeholder={
                "// Write or paste code here.\n// It is sent along with your next answer."
              }
              ariaLabel="Code editor"
              onChange={props.onCodeInputChange}
            />
          )}

          {!designNotesMode && (
            <div className="code-run-row">
              <label className="code-lang-wrap">
                <span className="visually-hidden">Language</span>
                <Code2 size={13} className="select-icon" aria-hidden="true" />
                <select
                  value={codeLanguage}
                  onChange={(e) => props.onCodeLanguageChange(e.target.value as CodeLanguage)}
                  disabled={isRunningCode}
                  aria-label="Code language"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
                <ChevronDown size={12} className="select-chevron" aria-hidden="true" />
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
            <div className="run-output" role="region" aria-label="Run output">
              <div className="run-output-header">
                <span>Output</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={props.onClearRunOutput}
                  aria-label="Clear output"
                  title="Clear output"
                >
                  <X size={13} aria-hidden="true" />
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
                aria-label={designNotesMode ? "Clear design notes" : "Clear code"}
                title="Clear"
              >
                <X size={14} aria-hidden="true" />
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
        ) : hasAnswers ? (
          <ClipboardCheck size={18} aria-hidden="true" />
        ) : (
          <RotateCcw size={18} aria-hidden="true" />
        )}
        {isLoadingDebrief
          ? "Generating debrief…"
          : !sessionStarted
            ? "Reset"
            : hasAnswers
              ? "End & Debrief"
              : "End Interview"}
      </button>

      {/* An escape hatch for a run you would rather not keep: clears the
          session on the spot, with no debrief and nothing saved to history. */}
      {sessionStarted && hasAnswers && (
        <button
          type="button"
          className="discard-btn"
          onClick={props.onDiscard}
          disabled={isActive || isLoadingDebrief}
          title="Throw this session away and start over — nothing is saved"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Discard &amp; Restart
        </button>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
