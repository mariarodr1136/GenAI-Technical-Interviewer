import { ArrowLeft, History, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ControlPanel } from "./components/ControlPanel.tsx";
import { ConversationLog } from "./components/ConversationLog.tsx";
import { DebriefModal } from "./components/DebriefModal.tsx";
import { HistoryModal } from "./components/HistoryModal.tsx";
import { JobDescriptionModal } from "./components/JobDescriptionModal.tsx";
import { ResumeModal } from "./components/ResumeModal.tsx";
import { SettingsBar } from "./components/SettingsBar.tsx";
import { useCountdown } from "./hooks/useCountdown.ts";
import { useRecorder } from "./hooks/useRecorder.ts";
import { useTTS } from "./hooks/useTTS.ts";
import {
  fetchDebrief,
  fetchHint,
  startInterview,
  streamAudioTurn,
  streamTextTurn,
  type TurnPayload
} from "./lib/api.ts";
import { formatRunResult, runCode } from "./lib/codeRunner.ts";
import { clearHistory, loadHistory, saveSession } from "./lib/history.ts";
import { loadPrefs, savePrefs } from "./lib/prefs.ts";
import { getFileExtension } from "./lib/recorder.ts";
import { sanitizeText } from "./lib/sanitizer.ts";
import type { SSECallbacks } from "./lib/stream.ts";
import type { ChatMessage, CodeLanguage, InterviewConfig, SavedSession } from "./types.ts";

const initialPrefs = loadPrefs();

export default function App({ onHome }: { onHome?: () => void }) {
  // ── Config (persisted) ───────────────────────────────────────────────────
  const [topic, setTopic] = useState(initialPrefs.topic);
  const [difficulty, setDifficulty] = useState(initialPrefs.difficulty);
  const [persona, setPersona] = useState(initialPrefs.persona);
  const [duration, setDuration] = useState(initialPrefs.duration);
  const [autoStart, setAutoStart] = useState(initialPrefs.autoStart);
  const [handsFree, setHandsFree] = useState(initialPrefs.handsFree);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(initialPrefs.voiceURI);
  const [darkMode, setDarkMode] = useState(initialPrefs.darkMode);
  const [jobDescription, setJobDescription] = useState(initialPrefs.jobDescription);
  const [resume, setResume] = useState(initialPrefs.resume);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>(initialPrefs.codeLanguage);

  // ── Modes ────────────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [isRunningCode, setIsRunningCode] = useState(false);

  // ── Session ──────────────────────────────────────────────────────────────
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSlowRequest, setIsSlowRequest] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [streamingReply, setStreamingReply] = useState("");
  const [error, setError] = useState("");

  // ── Debrief & history ────────────────────────────────────────────────────
  const [lastSession, setLastSession] = useState<SavedSession | null>(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SavedSession[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [showJobDescription, setShowJobDescription] = useState(false);
  const [showResume, setShowResume] = useState(false);

  // ── Refs for callbacks that outlive a render (TTS onDone, recorder stop) ─
  const abortRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationRef = useRef(conversation);
  const autoStartRef = useRef(autoStart);
  const textModeRef = useRef(textMode);
  const isMutedRef = useRef(isMuted);
  const isProcessingRef = useRef(isProcessing);
  useEffect(() => {
    conversationRef.current = conversation;
    autoStartRef.current = autoStart;
    textModeRef.current = textMode;
    isMutedRef.current = isMuted;
    isProcessingRef.current = isProcessing;
  }, [conversation, autoStart, textMode, isMuted, isProcessing]);

  // ── Hooks ────────────────────────────────────────────────────────────────
  const tts = useTTS({ voiceURI: selectedVoiceURI, muted: isMuted });

  const recorder = useRecorder({
    onComplete: (blob, mimeType) => void submitAudio(blob, mimeType),
    onError: setError,
    autoStopOnSilence: handsFree
  });

  const countdown = useCountdown(() => void handleReset());

  const sessionStarted = conversation.length > 0;
  const isActive = recorder.isRecording || isProcessing;

  const config: InterviewConfig = { topic, difficulty, persona, jobDescription, resume };

  // ── Persist preferences ──────────────────────────────────────────────────
  useEffect(() => {
    savePrefs({
      topic,
      difficulty,
      persona,
      duration,
      autoStart,
      handsFree,
      voiceURI: selectedVoiceURI,
      darkMode,
      jobDescription,
      resume,
      codeLanguage
    });
  }, [
    topic,
    difficulty,
    persona,
    duration,
    autoStart,
    handsFree,
    selectedVoiceURI,
    darkMode,
    jobDescription,
    resume,
    codeLanguage
  ]);

  // ── Dark mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // ── Session countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStarted && duration > 0) countdown.start(duration);
    if (!sessionStarted) countdown.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStarted]);

  // ── Processing state + cold-start indicator ─────────────────────────────
  // The "slow request" flag drives the free-tier wake-up notice in the meter.
  function startProcessing(): void {
    setIsProcessing(true);
    slowTimerRef.current = setTimeout(() => setIsSlowRequest(true), 4000);
  }

  function stopProcessing(): void {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    setIsSlowRequest(false);
    setIsProcessing(false);
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName)) return;
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        if (recorder.isRecording) recorder.stop();
        else if (!isProcessing && !textMode) void startRecording();
        return;
      }
      if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleMute();
        return;
      }
      if (e.code === "Escape" && recorder.isRecording) {
        recorder.stop();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  // ── Recording ────────────────────────────────────────────────────────────
  async function startRecording(): Promise<void> {
    if (isProcessingRef.current) return;
    setError("");
    tts.stop();
    await recorder.start();
  }

  // ── Turn submission ──────────────────────────────────────────────────────
  function autoStartAfterSpeech(): void {
    if (
      autoStartRef.current &&
      !textModeRef.current &&
      !isMutedRef.current &&
      !isProcessingRef.current
    ) {
      setTimeout(() => void startRecording(), 400);
    }
  }

  function applyTurn(transcript: string, reply: string, code?: string): void {
    setConversation((prev) => [
      ...prev,
      { role: "user", content: transcript, ...(code ? { code } : {}) },
      { role: "assistant", content: reply }
    ]);
    if (code) {
      setCodeInput("");
      setRunOutput("");
    }
    tts.finish(autoStartAfterSpeech);
  }

  // The attachment folds the latest run output in, so the interviewer reacts
  // to what the code actually did — not just how it reads.
  function buildAttachment(): string | undefined {
    if (!codeInput.trim()) return undefined;
    if (!runOutput || topic === "system-design") return codeInput;
    return `${codeInput}\n\n--- Output when run ---\n${runOutput}`;
  }

  async function runTurn(
    perform: (payload: TurnPayload, callbacks: SSECallbacks, signal: AbortSignal) => Promise<void>
  ): Promise<void> {
    startProcessing();
    setCurrentTranscript("");
    setStreamingReply("");
    setError("");

    const code = buildAttachment();
    const controller = new AbortController();
    abortRef.current = controller;

    let transcript = "";
    let streamText = "";

    try {
      await perform(
        { conversation: conversationRef.current, config, code },
        {
          onTranscript: (t) => {
            transcript = t;
            setCurrentTranscript(t);
          },
          onDelta: (d) => {
            streamText += d;
            setStreamingReply(sanitizeText(streamText));
            tts.feed(d);
          },
          onDone: (reply) => applyTurn(transcript, reply, code)
        },
        controller.signal
      );
    } catch (err) {
      tts.stop();
      if ((err as Error).name === "AbortError") {
        // User hit Stop Generating: keep whatever partial reply streamed in.
        if (transcript && streamText) applyTurn(transcript, sanitizeText(streamText), code);
      } else {
        setError((err as Error).message);
      }
    } finally {
      abortRef.current = null;
      stopProcessing();
      setCurrentTranscript("");
      setStreamingReply("");
    }
  }

  async function submitAudio(audioBlob: Blob, mimeType: string): Promise<void> {
    const fileName = `candidate-answer.${getFileExtension(mimeType)}`;
    await runTurn((payload, callbacks, signal) =>
      streamAudioTurn(audioBlob, fileName, payload, callbacks, signal)
    );
  }

  async function submitText(): Promise<void> {
    const text = textInput.trim();
    if (!text) return;
    setTextInput("");
    await runTurn((payload, callbacks, signal) => streamTextTurn(text, payload, callbacks, signal));
  }

  function stopGenerating(): void {
    abortRef.current?.abort();
  }

  // ── Run attached code (in-browser sandbox) ───────────────────────────────
  async function handleRunCode(): Promise<void> {
    if (!codeInput.trim() || isRunningCode) return;
    setIsRunningCode(true);
    setRunOutput("");
    try {
      const result = await runCode(codeLanguage, codeInput);
      setRunOutput(formatRunResult(result));
    } catch {
      setRunOutput("The code runner failed to start in this browser.");
    } finally {
      setIsRunningCode(false);
    }
  }

  // ── Begin interview ──────────────────────────────────────────────────────
  async function beginInterview(): Promise<void> {
    startProcessing();
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const question = await startInterview(config, controller.signal);
      setConversation([{ role: "assistant", content: question }]);
      tts.speak(question, autoStartAfterSpeech);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      abortRef.current = null;
      stopProcessing();
    }
  }

  // ── Hint ─────────────────────────────────────────────────────────────────
  async function requestHint(): Promise<void> {
    startProcessing();
    setError("");
    try {
      const hint = await fetchHint(conversationRef.current);
      setConversation((prev) => [...prev, { role: "assistant", content: hint, isHint: true }]);
      tts.speak(hint);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      stopProcessing();
    }
  }

  // ── Reset / debrief ──────────────────────────────────────────────────────
  async function handleReset(): Promise<void> {
    if (conversationRef.current.length === 0) {
      doReset();
      return;
    }

    setIsLoadingDebrief(true);
    setError("");
    tts.stop();

    try {
      const payload = await fetchDebrief(conversationRef.current);

      const session: SavedSession = {
        id: Date.now(),
        date: new Date().toISOString(),
        topic,
        difficulty,
        persona,
        turnCount: conversationRef.current.filter((m) => m.role === "user").length,
        conversation: [...conversationRef.current],
        debrief: payload
      };
      saveSession(session);
      setSessionHistory(loadHistory());

      setLastSession(session);
      setShowDebrief(true);
    } catch (err) {
      // Leave the error visible; the user can retry or reset manually.
      setError((err as Error).message);
    } finally {
      setIsLoadingDebrief(false);
    }
  }

  function doReset(): void {
    tts.stop();
    countdown.stop();
    setConversation([]);
    setError("");
    setLastSession(null);
    setShowDebrief(false);
    setTextInput("");
    setCodeInput("");
    setRunOutput("");
    setCurrentTranscript("");
    setStreamingReply("");
  }

  // ── Mute ─────────────────────────────────────────────────────────────────
  function toggleMute(): void {
    setIsMuted((prev) => !prev);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="app-shell">
      {showDebrief && lastSession && <DebriefModal session={lastSession} onClose={doReset} />}

      {showHistory && (
        <HistoryModal
          sessions={sessionHistory}
          onClearAll={() => {
            clearHistory();
            setSessionHistory([]);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showJobDescription && (
        <JobDescriptionModal
          value={jobDescription}
          onSave={setJobDescription}
          onClose={() => setShowJobDescription(false)}
        />
      )}

      {showResume && (
        <ResumeModal value={resume} onSave={setResume} onClose={() => setShowResume(false)} />
      )}

      <section className="workspace">
        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <div className="topbar">
          <div className="topbar-left">
            <p className="eyebrow">AI Interview Practice</p>
            <h1>GenAI Interviewer</h1>
          </div>

          <div className="topbar-right">
            <div className="topbar-actions">
              {onHome && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={onHome}
                  title="Back to homepage"
                >
                  <ArrowLeft size={17} />
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowHistory(true)}
                title="Session history"
              >
                <History size={17} />
                {sessionHistory.length > 0 && (
                  <span className="history-badge">{sessionHistory.length}</span>
                )}
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setDarkMode((d) => !d)}
                title={darkMode ? "Light mode" : "Dark mode"}
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            <div className="signal-row" aria-label="System status">
              <span className={recorder.hasMicAccess ? "signal ready" : "signal"}>Mic</span>
              <span
                className={
                  isProcessing ? "signal active" : recorder.hasMicAccess ? "signal ready" : "signal"
                }
              >
                Groq STT
              </span>
              <span
                className={
                  isProcessing ? "signal active" : recorder.hasMicAccess ? "signal ready" : "signal"
                }
              >
                Qwen3.6
              </span>
              <span
                className={tts.isSpeaking ? "signal active" : !isMuted ? "signal ready" : "signal"}
              >
                Browser TTS
              </span>
            </div>
          </div>
        </div>

        <SettingsBar
          topic={topic}
          difficulty={difficulty}
          persona={persona}
          duration={duration}
          voiceURI={selectedVoiceURI}
          autoStart={autoStart}
          handsFree={handsFree}
          textMode={textMode}
          locked={isActive || sessionStarted}
          voices={tts.availableVoices}
          countdownSeconds={countdown.secondsLeft}
          hasJobDescription={Boolean(jobDescription)}
          hasResume={Boolean(resume)}
          onTopicChange={setTopic}
          onDifficultyChange={setDifficulty}
          onPersonaChange={setPersona}
          onDurationChange={setDuration}
          onVoiceChange={setSelectedVoiceURI}
          onAutoStartChange={setAutoStart}
          onHandsFreeChange={setHandsFree}
          onOpenJobDescription={() => setShowJobDescription(true)}
          onOpenResume={() => setShowResume(true)}
        />

        <div className="interview-layout">
          <ControlPanel
            hasMicAccess={recorder.hasMicAccess}
            isRecording={recorder.isRecording}
            isProcessing={isProcessing}
            isSpeaking={tts.isSpeaking}
            isSlowRequest={isSlowRequest}
            isLoadingDebrief={isLoadingDebrief}
            sessionStarted={sessionStarted}
            recordingSeconds={recorder.seconds}
            audioLevel={recorder.audioLevel}
            error={error}
            isMuted={isMuted}
            textMode={textMode}
            codeMode={codeMode}
            textInput={textInput}
            codeInput={codeInput}
            designNotesMode={topic === "system-design"}
            codeLanguage={codeLanguage}
            runOutput={runOutput}
            isRunningCode={isRunningCode}
            onRequestMicrophone={() => void recorder.requestMicrophone()}
            onStartRecording={() => void startRecording()}
            onStopRecording={recorder.stop}
            onToggleMute={toggleMute}
            onToggleTextMode={() => {
              setTextMode((m) => !m);
              setError("");
            }}
            onToggleCodeMode={() => setCodeMode((m) => !m)}
            onTextInputChange={setTextInput}
            onCodeInputChange={setCodeInput}
            onCodeLanguageChange={setCodeLanguage}
            onRunCode={() => void handleRunCode()}
            onClearRunOutput={() => setRunOutput("")}
            onSubmitText={() => void submitText()}
            onBeginInterview={() => void beginInterview()}
            onRequestHint={() => void requestHint()}
            onStopGenerating={stopGenerating}
            onReset={() => void handleReset()}
          />

          <ConversationLog
            conversation={conversation}
            currentTranscript={currentTranscript}
            streamingReply={streamingReply}
          />
        </div>
      </section>
    </main>
  );
}
