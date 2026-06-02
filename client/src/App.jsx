import {
  ChevronDown,
  Keyboard,
  Loader2,
  MessageSquare,
  Mic,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFileExtension, getSupportedAudioMimeType } from "./lib/recorder.js";
import { speakText, stopSpeaking } from "./lib/speech.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const MAX_HISTORY_MESSAGES = 20;

const TOPICS = [
  { value: "general", label: "General" },
  { value: "algorithms", label: "Algorithms" },
  { value: "system-design", label: "System Design" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "behavioral", label: "Behavioral" }
];

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

const RATING_COLOR = {
  "Needs Practice": "coral",
  Developing: "amber",
  Solid: "teal",
  Strong: "teal"
};

export default function App() {
  const [topic, setTopic] = useState("general");
  const [difficulty, setDifficulty] = useState("medium");
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [debrief, setDebrief] = useState(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const conversationRef = useRef(conversation);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const conversationEndRef = useRef(null);

  // Refs to avoid stale closures in TTS onEnd callback
  const autoStartRef = useRef(autoStart);
  const textModeRef = useRef(textMode);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  useEffect(() => { autoStartRef.current = autoStart; }, [autoStart]);
  useEffect(() => { textModeRef.current = textMode; }, [textMode]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopLevelAnalysis();
      clearInterval(timerRef.current);
    };
  }, []);

  function startLevelAnalysis(stream) {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(dataArray);
        const rms = Math.sqrt(
          dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length
        );
        setAudioLevel(Math.min(100, Math.round(rms * 2.4)));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // AudioContext unavailable — level bar is non-critical
    }
  }

  function stopLevelAnalysis() {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }

  async function requestMicrophone() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support microphone capture.");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;
      setHasMicAccess(true);
      return stream;
    } catch {
      setError("Microphone access was blocked. Allow it in the browser and try again.");
      return null;
    }
  }

  async function startRecording() {
    if (isRecordingRef.current || isProcessingRef.current) return;
    setError("");
    stopSpeaking();

    const stream = streamRef.current ?? (await requestMicrophone());
    if (!stream) return;

    if (!("MediaRecorder" in window)) {
      setError("This browser does not support MediaRecorder.");
      return;
    }

    const mimeType = getSupportedAudioMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      submitAudio(new Blob(chunksRef.current, { type }), type);
    };

    recorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    startLevelAnalysis(stream);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setIsRecording(false);
    }
    stopLevelAnalysis();
    clearInterval(timerRef.current);
    timerRef.current = null;
    setRecordingSeconds(0);
  }

  async function submitAudio(audioBlob, mimeType) {
    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      const extension = getFileExtension(mimeType);
      formData.append("audio", audioBlob, `candidate-answer.${extension}`);
      formData.append("history", JSON.stringify(conversationRef.current.slice(-MAX_HISTORY_MESSAGES)));
      formData.append("topic", topic);
      formData.append("difficulty", difficulty);

      const response = await fetch(`${API_BASE_URL}/api/interview/turn`, {
        method: "POST",
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The interview server could not process the audio.");

      applyTurn(payload.transcript, payload.reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  async function submitText() {
    const text = textInput.trim();
    if (!text) return;

    setIsProcessing(true);
    setError("");
    setTextInput("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/text-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          history: JSON.stringify(conversationRef.current.slice(-MAX_HISTORY_MESSAGES)),
          topic,
          difficulty
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "The interview server could not process the text.");

      applyTurn(payload.transcript, payload.reply);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function applyTurn(transcript, reply) {
    setConversation((prev) =>
      [...prev, { role: "user", content: transcript }, { role: "assistant", content: reply }].slice(
        -MAX_HISTORY_MESSAGES
      )
    );

    if (!isMuted) {
      speakText(reply, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          if (autoStartRef.current && !textModeRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            setTimeout(startRecording, 400);
          }
        }
      });
    }
  }

  async function handleReset() {
    if (conversation.length === 0) {
      doReset();
      return;
    }

    setIsLoadingDebrief(true);
    setError("");
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: JSON.stringify(conversationRef.current)
        })
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not generate debrief.");

      setDebrief(payload);
      setShowDebrief(true);
    } catch (err) {
      setError(err.message);
      doReset();
    } finally {
      setIsLoadingDebrief(false);
    }
  }

  function doReset() {
    stopSpeaking();
    setConversation([]);
    setError("");
    setDebrief(null);
    setShowDebrief(false);
    setIsSpeaking(false);
    setTextInput("");
  }

  function toggleMute() {
    setIsMuted((prev) => {
      if (!prev) stopSpeaking();
      return !prev;
    });
  }

  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const sessionStarted = conversation.length > 0;
  const isActive = isRecording || isProcessing;

  const meterLabel = isRecording
    ? `Recording ${formatTime(recordingSeconds)}`
    : isProcessing
    ? "Thinking…"
    : isSpeaking
    ? "Speaking"
    : "Ready";

  const meterSub = isRecording
    ? "Answer the question, then stop the recording."
    : textMode
    ? "Type your answer below and submit."
    : "Start a turn when you are ready to answer.";

  return (
    <main className="app-shell">
      {showDebrief && debrief && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Session debrief">
          <div className="modal">
            <div className="modal-header">
              <h2>Session Debrief</h2>
              <button type="button" className="icon-btn" onClick={doReset} aria-label="Close debrief">
                <X size={18} />
              </button>
            </div>

            <div className={`rating-badge rating-${RATING_COLOR[debrief.readinessRating] ?? "teal"}`}>
              {debrief.readinessRating}
            </div>

            <div className="debrief-grid">
              {debrief.topicsCovered?.length > 0 && (
                <div className="debrief-block">
                  <span className="debrief-label">Topics Covered</span>
                  <div className="tag-row">
                    {debrief.topicsCovered.map((t) => (
                      <span className="tag" key={t}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="debrief-block">
                <span className="debrief-label">Strengths</span>
                <p>{debrief.strengths}</p>
              </div>

              <div className="debrief-block">
                <span className="debrief-label">Areas to Improve</span>
                <p>{debrief.areasToImprove}</p>
              </div>

              <div className="debrief-block closing">
                <p>{debrief.closingNote}</p>
              </div>
            </div>

            <button type="button" className="primary full-width" onClick={doReset}>
              Start New Session
            </button>
          </div>
        </div>
      )}

      <section className="workspace">
        <div className="topbar">
          <div>
            <p className="eyebrow">Voice-driven portfolio project</p>
            <h1>GenAI Technical Interviewer</h1>
          </div>

          <div className="signal-row" aria-label="System status">
            <span className={hasMicAccess ? "signal ready" : "signal"}>Mic</span>
            <span className={isProcessing ? "signal active" : hasMicAccess ? "signal ready" : "signal"}>
              Groq STT
            </span>
            <span className={isProcessing ? "signal active" : hasMicAccess ? "signal ready" : "signal"}>
              Llama 70B
            </span>
            <span className={isSpeaking ? "signal active" : !isMuted ? "signal ready" : "signal"}>
              Browser TTS
            </span>
          </div>
        </div>

        <div className="settings-bar">
          <label className="select-wrap">
            <span>Topic</span>
            <div className="select-inner">
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={isActive || sessionStarted}
              >
                {TOPICS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
            </div>
          </label>

          <label className="select-wrap">
            <span>Difficulty</span>
            <div className="select-inner">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isActive || sessionStarted}
              >
                {DIFFICULTIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
            </div>
          </label>

          <label className="toggle-wrap">
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              disabled={textMode}
            />
            <span>Auto-start mic after response</span>
          </label>
        </div>

        <div className="interview-layout">
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
                onClick={requestMicrophone}
                disabled={hasMicAccess || isActive}
              >
                <Mic size={18} aria-hidden="true" />
                {hasMicAccess ? "Mic Ready" : "Allow Mic"}
              </button>

              {!isRecording ? (
                <button
                  type="button"
                  className="primary"
                  onClick={startRecording}
                  disabled={(!canRecord(hasMicAccess, isProcessing)) || textMode}
                >
                  {isProcessing ? (
                    <Loader2 className="spin" size={18} aria-hidden="true" />
                  ) : (
                    <Mic size={18} aria-hidden="true" />
                  )}
                  Start
                </button>
              ) : (
                <button type="button" className="danger" onClick={stopRecording}>
                  <Square size={18} aria-hidden="true" />
                  Stop
                </button>
              )}

              <button
                type="button"
                onClick={toggleMute}
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
                onClick={() => { setTextMode((m) => !m); setError(""); }}
                disabled={isActive}
                title={textMode ? "Switch to voice input" : "Switch to text input"}
              >
                {textMode ? (
                  <Mic size={18} aria-hidden="true" />
                ) : (
                  <Keyboard size={18} aria-hidden="true" />
                )}
                {textMode ? "Voice" : "Type"}
              </button>
            </div>

            {textMode && (
              <div className="text-input-area">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitText();
                  }}
                  placeholder="Type your answer… (Ctrl+Enter to submit)"
                  rows={4}
                  disabled={isProcessing}
                />
                <button
                  type="button"
                  className="primary full-width"
                  onClick={submitText}
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
              onClick={handleReset}
              disabled={isActive || isLoadingDebrief}
            >
              {isLoadingDebrief ? (
                <Loader2 className="spin" size={18} aria-hidden="true" />
              ) : (
                <RotateCcw size={18} aria-hidden="true" />
              )}
              {isLoadingDebrief
                ? "Generating debrief…"
                : sessionStarted
                ? "End & Debrief"
                : "Reset"}
            </button>

            {error && <p className="error">{error}</p>}
          </section>

          <section
            className="conversation-panel"
            aria-label="Interview transcript"
            aria-live="polite"
          >
            {conversation.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={36} strokeWidth={1.3} />
                <p>Allow mic access and click Start to begin your interview session.</p>
              </div>
            ) : (
              <div className="conversation-log">
                {conversation.map((message, i) => (
                  <article
                    key={i}
                    className={message.role === "user" ? "turn user-turn" : "turn interviewer-turn"}
                  >
                    <span>{message.role === "user" ? "You" : "Interviewer"}</span>
                    <p>{message.content}</p>
                  </article>
                ))}
                <div ref={conversationEndRef} />
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function canRecord(hasMicAccess, isProcessing) {
  return hasMicAccess && !isProcessing;
}
