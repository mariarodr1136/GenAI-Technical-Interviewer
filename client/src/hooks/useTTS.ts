import { useEffect, useRef, useState } from "react";
import { sanitizeText } from "../lib/sanitizer.ts";
import { isSpeechSupported, SpeechQueue } from "../lib/speech.ts";

export interface TTS {
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
  /** Speak a complete text. onDone fires when audio finishes (or instantly when muted). */
  speak: (text: string, onDone?: () => void) => void;
  /** Feed a streamed delta; complete sentences are spoken as they arrive. */
  feed: (delta: string) => void;
  /** Signal end of stream; onDone fires when the audio queue drains. */
  finish: (onDone?: () => void) => void;
  stop: () => void;
}

export function useTTS({ voiceURI, muted }: { voiceURI: string; muted: boolean }): TTS {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const mutedRef = useRef(muted);
  const voiceRef = useRef(voiceURI);
  const queueRef = useRef<SpeechQueue | null>(null);

  // Lazily built outside render so the queue can capture refs safely.
  function getQueue(): SpeechQueue {
    queueRef.current ??= new SpeechQueue({
      transform: sanitizeText,
      getVoiceURI: () => voiceRef.current,
      onSpeakingChange: setIsSpeaking
    });
    return queueRef.current;
  }

  useEffect(() => {
    mutedRef.current = muted;
    voiceRef.current = voiceURI;
  }, [muted, voiceURI]);

  useEffect(() => {
    if (!isSpeechSupported()) return;
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
      setAvailableVoices(voices);
    }
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Cut speech immediately when the user mutes; stop everything on unmount.
  useEffect(() => {
    if (muted) queueRef.current?.stop();
  }, [muted]);
  useEffect(() => () => queueRef.current?.stop(), []);

  return {
    isSpeaking,
    availableVoices,
    speak: (text, onDone) => {
      if (mutedRef.current) {
        onDone?.();
        return;
      }
      getQueue().speak(text, onDone);
    },
    feed: (delta) => {
      if (mutedRef.current) return;
      getQueue().feed(delta);
    },
    finish: (onDone) => {
      if (mutedRef.current) {
        onDone?.();
        return;
      }
      getQueue().finish(onDone);
    },
    stop: () => queueRef.current?.stop()
  };
}
