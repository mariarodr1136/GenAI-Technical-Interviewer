import { Loader2, Mic, RotateCcw, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFileExtension, getSupportedAudioMimeType } from "./lib/recorder.js";
import { speakText, stopSpeaking } from "./lib/speech.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const MAX_HISTORY_MESSAGES = 10;

const initialStatus = {
  transcript: "Your spoken answer will appear here.",
  reply: "The interviewer response will appear here and play aloud."
};

export default function App() {
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState("");
  const [conversation, setConversation] = useState([]);
  const [status, setStatus] = useState(initialStatus);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const conversationRef = useRef(conversation);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function requestMicrophone() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support microphone capture.");
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      setHasMicAccess(true);
      return stream;
    } catch (micError) {
      setError("Microphone access was blocked. Allow it in the browser and try again.");
      return null;
    }
  }

  async function startRecording() {
    setError("");
    stopSpeaking();

    const stream = streamRef.current ?? (await requestMicrophone());
    if (!stream) {
      return;
    }

    if (!("MediaRecorder" in window)) {
      setError("This browser does not support MediaRecorder.");
      return;
    }

    const mimeType = getSupportedAudioMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(chunksRef.current, { type });
      submitAudio(audioBlob, type);
    };

    recorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function submitAudio(audioBlob, mimeType) {
    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();
      const extension = getFileExtension(mimeType);

      formData.append("audio", audioBlob, `candidate-answer.${extension}`);
      formData.append("history", JSON.stringify(conversationRef.current.slice(-MAX_HISTORY_MESSAGES)));

      const response = await fetch(`${API_BASE_URL}/api/interview/turn`, {
        method: "POST",
        body: formData
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "The interview server could not process the audio.");
      }

      setStatus({
        transcript: payload.transcript,
        reply: payload.reply
      });

      setConversation((current) =>
        [
          ...current,
          { role: "user", content: payload.transcript },
          { role: "assistant", content: payload.reply }
        ].slice(-MAX_HISTORY_MESSAGES)
      );

      if (!isMuted) {
        speakText(payload.reply);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsProcessing(false);
    }
  }

  function resetInterview() {
    stopSpeaking();
    setConversation([]);
    setStatus(initialStatus);
    setError("");
  }

  function toggleMute() {
    setIsMuted((current) => {
      const next = !current;
      if (next) {
        stopSpeaking();
      }
      return next;
    });
  }

  const canRecord = hasMicAccess && !isProcessing;

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="topbar">
          <div>
            <p className="eyebrow">Voice-driven portfolio project</p>
            <h1>GenAI Technical Interviewer</h1>
          </div>

          <div className="signal-row" aria-label="System status">
            <span className={hasMicAccess ? "signal ready" : "signal"}>Mic</span>
            <span className="signal ready">Groq STT</span>
            <span className="signal ready">Llama 70B</span>
            <span className="signal ready">Browser TTS</span>
          </div>
        </div>

        <div className="interview-layout">
          <section className="control-panel" aria-label="Interview controls">
            <div className="meter">
              <span className={isRecording ? "pulse recording" : "pulse"} />
              <div>
                <p>{isRecording ? "Recording" : isProcessing ? "Thinking" : "Ready"}</p>
                <span>
                  {isRecording
                    ? "Answer the question, then stop the recording."
                    : "Start a turn when you are ready to answer."}
                </span>
              </div>
            </div>

            <div className="button-grid">
              <button type="button" onClick={requestMicrophone} disabled={hasMicAccess || isRecording}>
                <Mic size={18} aria-hidden="true" />
                {hasMicAccess ? "Mic Ready" : "Allow Mic"}
              </button>

              {!isRecording ? (
                <button
                  type="button"
                  className="primary"
                  onClick={startRecording}
                  disabled={!canRecord && hasMicAccess}
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

              <button type="button" onClick={toggleMute} title={isMuted ? "Turn voice on" : "Mute voice"}>
                {isMuted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                {isMuted ? "Muted" : "Voice On"}
              </button>

              <button type="button" onClick={resetInterview} disabled={isRecording || isProcessing}>
                <RotateCcw size={18} aria-hidden="true" />
                Reset
              </button>
            </div>

            {error ? <p className="error">{error}</p> : null}
          </section>

          <section className="conversation-panel" aria-label="Interview transcript">
            <article className="turn user-turn">
              <span>Candidate transcript</span>
              <p>{status.transcript}</p>
            </article>

            <article className="turn interviewer-turn">
              <span>Interviewer</span>
              <p>{status.reply}</p>
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
