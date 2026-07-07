import { useEffect, useRef, useState } from "react";
import { getSupportedAudioMimeType } from "../lib/recorder.ts";

export interface Recorder {
  hasMicAccess: boolean;
  isRecording: boolean;
  seconds: number;
  audioLevel: number;
  requestMicrophone: () => Promise<MediaStream | null>;
  start: () => Promise<void>;
  stop: () => void;
}

interface UseRecorderOptions {
  onComplete: (blob: Blob, mimeType: string) => void;
  onError: (message: string) => void;
  /** Hands-free mode: stop automatically after a pause once the candidate has spoken. */
  autoStopOnSilence?: boolean;
}

// Tuned for speech with browser noise suppression on: ambient level sits
// well under 10, and a 1.8s pause is a finished answer, not a thinking gap.
const SILENCE_LEVEL = 10;
const SILENCE_HOLD_MS = 1800;

export function useRecorder({
  onComplete,
  onError,
  autoStopOnSilence = false
}: UseRecorderOptions): Recorder {
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);

  // Silence tracking for hands-free auto-stop.
  const lastLoudAtRef = useRef(0);
  const hasSpokenRef = useRef(false);

  // Latest-ref pattern so the MediaRecorder onstop callback never goes stale.
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const autoStopRef = useRef(autoStopOnSilence);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    autoStopRef.current = autoStopOnSilence;
  }, [onComplete, onError, autoStopOnSilence]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopLevelAnalysis();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startLevelAnalysis(stream: MediaStream): void {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = audioContext;

      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(data);
        const rms = Math.sqrt(data.reduce((sum, v) => sum + v * v, 0) / data.length);
        const level = Math.min(100, Math.round(rms * 2.4));
        setAudioLevel(level);

        const now = performance.now();
        if (level >= SILENCE_LEVEL) {
          lastLoudAtRef.current = now;
          hasSpokenRef.current = true;
        }
        // Only auto-stop after the candidate has actually said something —
        // otherwise a slow start would end the recording instantly.
        if (
          autoStopRef.current &&
          isRecordingRef.current &&
          hasSpokenRef.current &&
          now - lastLoudAtRef.current >= SILENCE_HOLD_MS
        ) {
          stop();
          return;
        }
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // Non-critical — silently skip if AudioContext is unavailable.
    }
  }

  function stopLevelAnalysis(): void {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setAudioLevel(0);
  }

  async function requestMicrophone(): Promise<MediaStream | null> {
    if (!navigator.mediaDevices?.getUserMedia) {
      onErrorRef.current("This browser does not support microphone capture.");
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
      onErrorRef.current("Microphone access was blocked. Allow it in the browser and try again.");
      return null;
    }
  }

  async function start(): Promise<void> {
    if (isRecordingRef.current) return;

    const stream = streamRef.current ?? (await requestMicrophone());
    if (!stream) return;

    if (!("MediaRecorder" in window)) {
      onErrorRef.current("This browser does not support MediaRecorder.");
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
      onCompleteRef.current(new Blob(chunksRef.current, { type }), type);
    };

    recorder.start();
    isRecordingRef.current = true;
    setIsRecording(true);
    setSeconds(0);
    hasSpokenRef.current = false;
    lastLoudAtRef.current = performance.now();
    startLevelAnalysis(stream);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  function stop(): void {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    stopLevelAnalysis();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSeconds(0);
  }

  return { hasMicAccess, isRecording, seconds, audioLevel, requestMicrophone, start, stop };
}
