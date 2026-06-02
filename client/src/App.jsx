import {
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  History,
  Keyboard,
  Lightbulb,
  Loader2,
  MessageSquare,
  Mic,
  Moon,
  PlayCircle,
  RotateCcw,
  Square,
  Sun,
  Timer,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFileExtension, getSupportedAudioMimeType } from "./lib/recorder.js";
import { clearHistory, loadHistory, saveSession } from "./lib/history.js";
import { speakText, stopSpeaking } from "./lib/speech.js";
import { consumeSSE } from "./lib/stream.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const MAX_HISTORY = 20;

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

const PERSONAS = [
  { value: "professional", label: "Professional" },
  { value: "strict", label: "Strict" },
  { value: "encouraging", label: "Encouraging" },
  { value: "fast-paced", label: "Fast-paced" }
];

const DURATIONS = [
  { value: 0, label: "No timer" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" }
];

const RATING_COLOR = {
  "Needs Practice": "coral",
  Developing: "amber",
  Solid: "teal",
  Strong: "teal"
};

const RATING_VALUE = { "Needs Practice": 1, Developing: 2, Solid: 3, Strong: 4 };

function RatingChart({ sessions }) {
  const rated = sessions
    .filter((s) => s.debrief?.readinessRating && RATING_VALUE[s.debrief.readinessRating])
    .slice(0, 10)
    .reverse();

  if (rated.length < 2) return null;

  const W = 300, H = 72, PAD = 12;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;
  const xStep = innerW / (rated.length - 1);
  const yScale = innerH / 3;

  const pts = rated.map((s, i) => ({
    x: PAD + i * xStep,
    y: H - PAD - (RATING_VALUE[s.debrief.readinessRating] - 1) * yScale
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rating-chart" aria-label="Rating trend over sessions">
      {[1, 2, 3, 4].map((v) => (
        <line
          key={v}
          x1={PAD} y1={H - PAD - (v - 1) * yScale}
          x2={W - PAD} y2={H - PAD - (v - 1) * yScale}
          stroke="var(--line)" strokeWidth="1"
        />
      ))}
      <polyline
        points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--teal)" />
      ))}
    </svg>
  );
}

function formatSessionDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

export default function App() {
  // ── Config ──────────────────────────────────────────────────────────────
  const [topic, setTopic] = useState("general");
  const [difficulty, setDifficulty] = useState("medium");
  const [persona, setPersona] = useState("professional");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(
    () => localStorage.getItem("genai_voice") ?? ""
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("genai_dark_mode") === "true"
  );
  const [availableVoices, setAvailableVoices] = useState([]);

  // ── Recording ───────────────────────────────────────────────────────────
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");

  // ── Streaming display ───────────────────────────────────────────────────
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [streamingReply, setStreamingReply] = useState("");

  // ── Session ─────────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(0);
  const [timerExpired, setTimerExpired] = useState(false);

  // ── Debrief ─────────────────────────────────────────────────────────────
  const [debrief, setDebrief] = useState(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);

  // ── History ─────────────────────────────────────────────────────────────
  const [sessionHistory, setSessionHistory] = useState(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // ── UI feedback ─────────────────────────────────────────────────────────
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // ── Refs: media ─────────────────────────────────────────────────────────
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── Refs: timers ────────────────────────────────────────────────────────
  const recordTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // ── Refs: stale-closure prevention ──────────────────────────────────────
  const conversationRef = useRef(conversation);
  const topicRef = useRef(topic);
  const difficultyRef = useRef(difficulty);
  const personaRef = useRef(persona);
  const autoStartRef = useRef(autoStart);
  const textModeRef = useRef(textMode);
  const isRecordingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const selectedVoiceURIRef = useRef(selectedVoiceURI);

  // ── Refs: DOM ────────────────────────────────────────────────────────────
  const conversationEndRef = useRef(null);

  // ── Sync refs ────────────────────────────────────────────────────────────
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);
  useEffect(() => { topicRef.current = topic; }, [topic]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { personaRef.current = persona; }, [persona]);
  useEffect(() => { autoStartRef.current = autoStart; }, [autoStart]);
  useEffect(() => { textModeRef.current = textMode; }, [textMode]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { selectedVoiceURIRef.current = selectedVoiceURI; }, [selectedVoiceURI]);

  // ── Dark mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("genai_dark_mode", darkMode ? "true" : "false");
  }, [darkMode]);

  // ── Persist voice preference ─────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("genai_voice", selectedVoiceURI);
  }, [selectedVoiceURI]);

  // ── Load TTS voices ──────────────────────────────────────────────────────
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis?.getVoices().filter((v) => v.lang.startsWith("en")) ?? [];
      setAvailableVoices(voices);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, streamingReply]);

  // ── Start countdown when session begins ──────────────────────────────────
  useEffect(() => {
    if (conversation.length > 0 && sessionDuration > 0 && !countdownRef.current) {
      startCountdown(sessionDuration);
    }
  }, [conversation.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle timer expiry ──────────────────────────────────────────────────
  useEffect(() => {
    if (!timerExpired) return;
    setTimerExpired(false);
    handleReset();
  }, [timerExpired]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e) {
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName)) return;
      if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        if (isRecordingRef.current) stopRecording();
        else if (!isProcessingRef.current && !textModeRef.current) startRecording();
        return;
      }
      if (e.code === "KeyM" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        toggleMute();
        return;
      }
      if (e.code === "Escape" && isRecordingRef.current) {
        stopRecording();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []); // stable — all mutable values accessed via refs

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopSpeaking();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopLevelAnalysis();
      clearInterval(recordTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  // ── Audio level analysis ─────────────────────────────────────────────────
  function startLevelAnalysis(stream) {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(data);
        const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
        setAudioLevel(Math.min(100, Math.round(rms * 2.4)));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // Non-critical — silently skip if AudioContext is unavailable.
    }
  }

  function stopLevelAnalysis() {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }

  // ── Session countdown ────────────────────────────────────────────────────
  function startCountdown(minutes) {
    let remaining = minutes * 60;
    setSessionSecondsLeft(remaining);
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setSessionSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        setTimerExpired(true);
      }
    }, 1000);
  }

  function stopCountdown() {
    clearInterval(countdownRef.current);
    countdownRef.current = null;
    setSessionSecondsLeft(0);
  }

  // ── Microphone ───────────────────────────────────────────────────────────
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

  // ── Recording ────────────────────────────────────────────────────────────
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

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      submitAudio(new Blob(chunksRef.current, { type }), type);
    };

    recorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);
    startLevelAnalysis(stream);
    recordTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setIsRecording(false);
    }
    stopLevelAnalysis();
    clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
    setRecordingSeconds(0);
  }

  // ── Submission (streaming) ───────────────────────────────────────────────
  async function submitAudio(audioBlob, mimeType) {
    setIsProcessing(true);
    setCurrentTranscript("");
    setStreamingReply("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `candidate-answer.${getFileExtension(mimeType)}`);
      formData.append("history", JSON.stringify(conversationRef.current.slice(-MAX_HISTORY)));
      formData.append("topic", topicRef.current);
      formData.append("difficulty", difficultyRef.current);
      formData.append("persona", personaRef.current);

      const response = await fetch(`${API_BASE_URL}/api/interview/turn`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "The server could not process the audio.");
      }

      let transcript = "";
      let streamText = "";

      await consumeSSE(response, {
        onTranscript: (t) => { transcript = t; setCurrentTranscript(t); },
        onDelta: (d) => { streamText += d; setStreamingReply(streamText); },
        onDone: (reply) => applyTurn(transcript, reply)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setCurrentTranscript("");
      setStreamingReply("");
    }
  }

  async function submitText() {
    const text = textInput.trim();
    if (!text) return;

    setIsProcessing(true);
    setCurrentTranscript("");
    setStreamingReply("");
    setError("");
    setTextInput("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/text-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          history: JSON.stringify(conversationRef.current.slice(-MAX_HISTORY)),
          topic: topicRef.current,
          difficulty: difficultyRef.current,
          persona: personaRef.current
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "The server could not process the text.");
      }

      let transcript = "";
      let streamText = "";

      await consumeSSE(response, {
        onTranscript: (t) => { transcript = t; setCurrentTranscript(t); },
        onDelta: (d) => { streamText += d; setStreamingReply(streamText); },
        onDone: (reply) => applyTurn(transcript, reply)
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
      setCurrentTranscript("");
      setStreamingReply("");
    }
  }

  // ── Begin Interview (opening question) ──────────────────────────────────
  async function beginInterview() {
    setIsProcessing(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, persona })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not start interview.");

      const firstQuestion = payload.question;
      setConversation([{ role: "assistant", content: firstQuestion }]);

      if (!isMutedRef.current) {
        speakText(firstQuestion, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            if (autoStartRef.current && !textModeRef.current) setTimeout(startRecording, 400);
          },
          voiceURI: selectedVoiceURIRef.current || undefined
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Hint ────────────────────────────────────────────────────────────────
  async function requestHint() {
    setIsProcessing(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: JSON.stringify(conversationRef.current.slice(-MAX_HISTORY)) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not get hint.");

      const hintMsg = { role: "assistant", content: payload.hint, isHint: true };
      setConversation((prev) => [...prev, hintMsg].slice(-MAX_HISTORY));

      if (!isMutedRef.current) {
        speakText(payload.hint, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          voiceURI: selectedVoiceURIRef.current || undefined
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // ── Apply completed turn ─────────────────────────────────────────────────
  function applyTurn(transcript, reply) {
    setConversation((prev) =>
      [...prev, { role: "user", content: transcript }, { role: "assistant", content: reply }].slice(-MAX_HISTORY)
    );

    if (!isMutedRef.current) {
      speakText(reply, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          if (autoStartRef.current && !textModeRef.current && !isRecordingRef.current && !isProcessingRef.current) {
            setTimeout(startRecording, 400);
          }
        },
        voiceURI: selectedVoiceURIRef.current || undefined
      });
    }
  }

  // ── Reset / Debrief ──────────────────────────────────────────────────────
  async function handleReset() {
    if (conversationRef.current.length === 0) { doReset(); return; }

    setIsLoadingDebrief(true);
    setError("");
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: JSON.stringify(conversationRef.current) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not generate debrief.");

      const session = {
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

      setDebrief(payload);
      setShowDebrief(true);
    } catch (err) {
      setError(err.message);
      // Do NOT call doReset() here — it calls setError("") which would wipe
      // the error message before React renders it (batched state updates).
      // The user can see the error and retry, or click Reset to clear manually.
    } finally {
      setIsLoadingDebrief(false);
    }
  }

  function doReset() {
    stopSpeaking();
    stopCountdown();
    setConversation([]);
    setError("");
    setDebrief(null);
    setShowDebrief(false);
    setIsSpeaking(false);
    setTextInput("");
    setCurrentTranscript("");
    setStreamingReply("");
  }

  // ── Transcript utilities ─────────────────────────────────────────────────
  function buildTranscriptText() {
    return conversation
      .map((m) => `${m.role === "user" ? "You" : "Interviewer"}: ${m.content}`)
      .join("\n\n");
  }

  function copyTranscript() {
    navigator.clipboard.writeText(buildTranscriptText()).then(() => {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    });
  }

  function downloadTranscript() {
    const text = buildTranscriptText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Mute ────────────────────────────────────────────────────────────────
  function toggleMute() {
    setIsMuted((prev) => { if (!prev) stopSpeaking(); return !prev; });
  }

  // ── Formatting ──────────────────────────────────────────────────────────
  function formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  // ── Derived ─────────────────────────────────────────────────────────────
  const sessionStarted = conversation.length > 0;
  const isActive = isRecording || isProcessing;

  const meterLabel = isRecording
    ? `Recording ${formatTime(recordingSeconds)}`
    : isProcessing ? "Thinking…"
    : isSpeaking ? "Speaking"
    : "Ready";

  const meterSub = isRecording
    ? "Answer the question, then stop the recording."
    : textMode ? "Type your answer below and submit."
    : sessionStarted ? "Start a turn when you are ready to answer."
    : "Click Begin Interview or Start to get your first question.";

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="app-shell">

      {/* ── Debrief modal ─────────────────────────────────────────────── */}
      {showDebrief && debrief && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Session debrief">
          <div className="modal">
            <div className="modal-header">
              <h2>Session Debrief</h2>
              <button type="button" className="icon-btn" onClick={doReset} aria-label="Close">
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
                    {debrief.topicsCovered.map((t) => <span className="tag" key={t}>{t}</span>)}
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

      {/* ── History modal ─────────────────────────────────────────────── */}
      {showHistory && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Interview history">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h2>Interview History</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {sessionHistory.length > 0 && (
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => { clearHistory(); setSessionHistory([]); setExpandedSessionId(null); }}
                    title="Clear all history"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={() => setShowHistory(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            {sessionHistory.length === 0 ? (
              <div className="history-empty">
                <Clock size={32} strokeWidth={1.3} />
                <p>No sessions recorded yet. Complete an interview and click End &amp; Debrief to save your first session.</p>
              </div>
            ) : (
              <>
                {sessionHistory.length >= 2 && (
                  <div className="chart-wrap">
                    <span className="debrief-label">Readiness Trend</span>
                    <div className="chart-legend">
                      {["Needs Practice", "Developing", "Solid", "Strong"].map((r, i) => (
                        <span key={r} className="chart-legend-item">
                          <span className="chart-legend-dot" style={{ bottom: `${(i / 3) * 100}%` }} />
                          {r}
                        </span>
                      ))}
                    </div>
                    <RatingChart sessions={sessionHistory} />
                  </div>
                )}

                <div className="history-list">
                  {sessionHistory.map((s) => (
                    <div key={s.id} className="history-card">
                      <div className="history-card-header" onClick={() => setExpandedSessionId(expandedSessionId === s.id ? null : s.id)}>
                        <div className="history-card-meta">
                          <span className="history-date">{formatSessionDate(s.date)}</span>
                          <div className="tag-row">
                            <span className="tag">{TOPICS.find((t) => t.value === s.topic)?.label ?? s.topic}</span>
                            <span className="tag">{s.difficulty}</span>
                            <span className="tag">{s.persona}</span>
                          </div>
                        </div>
                        <div className="history-card-right">
                          {s.debrief?.readinessRating && (
                            <span className={`rating-badge rating-${RATING_COLOR[s.debrief.readinessRating] ?? "teal"}`} style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                              {s.debrief.readinessRating}
                            </span>
                          )}
                          <span className="history-turns">{s.turnCount} turn{s.turnCount !== 1 ? "s" : ""}</span>
                          <ChevronDown
                            size={16}
                            className={`history-chevron ${expandedSessionId === s.id ? "open" : ""}`}
                          />
                        </div>
                      </div>

                      {expandedSessionId === s.id && (
                        <div className="history-transcript">
                          {s.conversation.map((m, i) => (
                            <article key={i} className={m.role === "user" ? "turn user-turn" : "turn interviewer-turn"}>
                              <span>{m.role === "user" ? "You" : "Interviewer"}</span>
                              <p>{m.content}</p>
                            </article>
                          ))}
                          {s.debrief && (
                            <div className="debrief-block" style={{ marginTop: 8 }}>
                              <span className="debrief-label">Debrief Summary</span>
                              <p style={{ marginBottom: 4 }}><strong>Strengths:</strong> {s.debrief.strengths}</p>
                              <p><strong>Improve:</strong> {s.debrief.areasToImprove}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <section className="workspace">
        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <div className="topbar">
          <div>
            <p className="eyebrow">Voice-driven portfolio project</p>
            <h1>GenAI Technical Interviewer</h1>
          </div>

          <div className="topbar-right">
            <div className="topbar-actions">
              <button type="button" className="icon-btn" onClick={() => setShowHistory(true)} title="Session history">
                <History size={17} />
                {sessionHistory.length > 0 && <span className="history-badge">{sessionHistory.length}</span>}
              </button>
              <button type="button" className="icon-btn" onClick={() => setDarkMode((d) => !d)} title={darkMode ? "Light mode" : "Dark mode"}>
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            <div className="signal-row" aria-label="System status">
              <span className={hasMicAccess ? "signal ready" : "signal"}>Mic</span>
              <span className={isProcessing ? "signal active" : hasMicAccess ? "signal ready" : "signal"}>Groq STT</span>
              <span className={isProcessing ? "signal active" : hasMicAccess ? "signal ready" : "signal"}>Llama 70B</span>
              <span className={isSpeaking ? "signal active" : !isMuted ? "signal ready" : "signal"}>Browser TTS</span>
            </div>
          </div>
        </div>

        {/* ── Settings bar ────────────────────────────────────────────── */}
        <div className="settings-bar">
          <label className="select-wrap">
            <span>Topic</span>
            <div className="select-inner">
              <select value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isActive || sessionStarted}>
                {TOPICS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
            </div>
          </label>

          <label className="select-wrap">
            <span>Difficulty</span>
            <div className="select-inner">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={isActive || sessionStarted}>
                {DIFFICULTIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
            </div>
          </label>

          <label className="select-wrap">
            <span>Persona</span>
            <div className="select-inner">
              <select value={persona} onChange={(e) => setPersona(e.target.value)} disabled={isActive || sessionStarted}>
                {PERSONAS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
            </div>
          </label>

          <label className="select-wrap">
            <span>Timer</span>
            <div className="select-inner">
              <select value={sessionDuration} onChange={(e) => setSessionDuration(Number(e.target.value))} disabled={isActive || sessionStarted}>
                {DURATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
              <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
            </div>
          </label>

          {availableVoices.length > 0 && (
            <label className="select-wrap">
              <span>Voice</span>
              <div className="select-inner">
                <select value={selectedVoiceURI} onChange={(e) => setSelectedVoiceURI(e.target.value)}>
                  <option value="">Default</option>
                  {availableVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
                </select>
                <ChevronDown size={13} className="select-chevron" aria-hidden="true" />
              </div>
            </label>
          )}

          <label className="toggle-wrap">
            <input type="checkbox" checked={autoStart} onChange={(e) => setAutoStart(e.target.checked)} disabled={textMode} />
            <span>Auto-start mic</span>
          </label>

          {sessionSecondsLeft > 0 && (
            <div className={`countdown-pill ${sessionSecondsLeft <= 60 ? "urgent" : ""}`}>
              <Timer size={13} />
              {formatTime(sessionSecondsLeft)}
            </div>
          )}
        </div>

        {/* ── Keyboard hint ────────────────────────────────────────────── */}
        <p className="kbd-hint">
          <kbd>Space</kbd> start/stop · <kbd>M</kbd> mute · <kbd>Esc</kbd> stop
        </p>

        {/* ── Interview layout ─────────────────────────────────────────── */}
        <div className="interview-layout">

          {/* ── Control panel ─────────────────────────────────────────── */}
          <section className="control-panel" aria-label="Interview controls">
            <div className="meter">
              <span className={
                isRecording ? "pulse recording"
                : isProcessing ? "pulse processing"
                : isSpeaking ? "pulse speaking"
                : "pulse"
              } />
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
              <button type="button" onClick={requestMicrophone} disabled={hasMicAccess || isActive}>
                <Mic size={18} aria-hidden="true" />
                {hasMicAccess ? "Mic Ready" : "Allow Mic"}
              </button>

              {!isRecording ? (
                <button type="button" className="primary" onClick={startRecording} disabled={(hasMicAccess && isProcessing) || textMode}>
                  {isProcessing ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
                  Start
                </button>
              ) : (
                <button type="button" className="danger" onClick={stopRecording}>
                  <Square size={18} aria-hidden="true" />
                  Stop
                </button>
              )}

              <button type="button" onClick={toggleMute} title={isMuted ? "Turn voice on" : "Mute voice"}>
                {isMuted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                {isMuted ? "Muted" : "Voice On"}
              </button>

              <button type="button" onClick={() => { setTextMode((m) => !m); setError(""); }} disabled={isActive} title={textMode ? "Switch to voice" : "Switch to text"}>
                {textMode ? <Mic size={18} aria-hidden="true" /> : <Keyboard size={18} aria-hidden="true" />}
                {textMode ? "Voice" : "Type"}
              </button>
            </div>

            {!sessionStarted && !isActive && (
              <button type="button" className="primary full-width begin-btn" onClick={beginInterview}>
                <PlayCircle size={18} aria-hidden="true" />
                Begin Interview
              </button>
            )}

            {sessionStarted && !isActive && (
              <button type="button" className="hint-btn full-width" onClick={requestHint} disabled={isLoadingDebrief}>
                <Lightbulb size={18} aria-hidden="true" />
                Get Hint
              </button>
            )}

            {textMode && (
              <div className="text-input-area">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitText(); }}
                  placeholder="Type your answer… (Ctrl+Enter to submit)"
                  rows={4}
                  disabled={isProcessing}
                />
                <button type="button" className="primary full-width" onClick={submitText} disabled={isProcessing || !textInput.trim()}>
                  {isProcessing ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Zap size={18} aria-hidden="true" />}
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
              {isLoadingDebrief
                ? <Loader2 className="spin" size={18} aria-hidden="true" />
                : <RotateCcw size={18} aria-hidden="true" />}
              {isLoadingDebrief ? "Generating debrief…" : sessionStarted ? "End & Debrief" : "Reset"}
            </button>

            {error && <p className="error">{error}</p>}
          </section>

          {/* ── Conversation panel ────────────────────────────────────── */}
          <section className="conversation-panel" aria-label="Interview transcript" aria-live="polite">
            {conversation.length === 0 && !currentTranscript && !streamingReply ? (
              <div className="empty-state">
                <MessageSquare size={36} strokeWidth={1.3} />
                <p>Click Begin Interview for a first question, or Start to jump straight into recording.</p>
              </div>
            ) : (
              <>
                {conversation.length > 0 && (
                  <div className="conversation-toolbar">
                    <span className="turn-count">
                      {conversation.filter((m) => m.role === "user").length} turn{conversation.filter((m) => m.role === "user").length !== 1 ? "s" : ""}
                    </span>
                    <button type="button" className="icon-btn" onClick={copyTranscript} title="Copy transcript">
                      {copiedTranscript ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                    <button type="button" className="icon-btn" onClick={downloadTranscript} title="Download transcript">
                      <Download size={15} />
                    </button>
                  </div>
                )}

                <div className="conversation-log">
                  {conversation.map((message, i) => (
                    <article
                      key={i}
                      className={
                        message.role === "user" ? "turn user-turn"
                        : message.isHint ? "turn hint-turn"
                        : "turn interviewer-turn"
                      }
                    >
                      <span>{message.role === "user" ? "You" : message.isHint ? "💡 Hint" : "Interviewer"}</span>
                      <p>{message.content}</p>
                    </article>
                  ))}

                  {currentTranscript && (
                    <article className="turn user-turn streaming-pending">
                      <span>You</span>
                      <p>{currentTranscript}</p>
                    </article>
                  )}

                  {streamingReply && (
                    <article className="turn interviewer-turn">
                      <span>Interviewer</span>
                      <p>{streamingReply}<span className="cursor-blink">▋</span></p>
                    </article>
                  )}

                  <div ref={conversationEndRef} />
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
