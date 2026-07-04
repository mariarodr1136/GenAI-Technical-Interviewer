/**
 * Sentence-based speech queue on top of window.speechSynthesis.
 *
 * Why sentences instead of one big utterance:
 * - Chrome silently stops long utterances (~15s); short ones are reliable.
 * - Sentences can be spoken while the rest of the reply is still streaming
 *   from the LLM, which cuts seconds off the perceived response time.
 */

export interface SpeechQueueOptions {
  /** Applied to every sentence before it is spoken (e.g. banned-word sanitizer). */
  transform?: (text: string) => string;
  /** Read at speak time so the user can switch voices mid-session. */
  getVoiceURI?: () => string;
  onSpeakingChange?: (speaking: boolean) => void;
}

function splitBuffer(buffer: string): { sentences: string[]; remainder: string } {
  const parts = buffer.split(/(?<=[.!?])\s+/);
  const remainder = parts.pop() ?? "";
  return { sentences: parts.map((s) => s.trim()).filter(Boolean), remainder };
}

export function isSpeechSupported(): boolean {
  return "speechSynthesis" in window;
}

export class SpeechQueue {
  private queue: string[] = [];
  private buffer = "";
  private speaking = false;
  private active = false;
  private onDrain: (() => void) | null = null;
  private readonly transform: (text: string) => string;
  private readonly getVoiceURI: () => string;
  private readonly onSpeakingChange?: (speaking: boolean) => void;

  constructor({ transform, getVoiceURI, onSpeakingChange }: SpeechQueueOptions = {}) {
    this.transform = transform ?? ((text) => text);
    this.getVoiceURI = getVoiceURI ?? (() => "");
    this.onSpeakingChange = onSpeakingChange;
  }

  /** Queue a complete piece of text (opening question, hint, …). */
  speak(text: string, onDone?: () => void): void {
    this.feed(text.endsWith(" ") ? text : `${text} `);
    this.finish(onDone);
  }

  /** Feed a streamed delta; complete sentences are spoken as they form. */
  feed(delta: string): void {
    if (!isSpeechSupported()) return;
    this.buffer += delta;
    const { sentences, remainder } = splitBuffer(this.buffer);
    this.buffer = remainder;
    for (const sentence of sentences) this.enqueue(sentence);
  }

  /** No more text is coming; flush the buffer and fire onDone when audio ends. */
  finish(onDone?: () => void): void {
    if (!isSpeechSupported()) {
      onDone?.();
      return;
    }
    const rest = this.buffer.trim();
    this.buffer = "";
    if (rest) this.enqueue(rest);
    if (!this.active && this.queue.length === 0) {
      onDone?.();
      return;
    }
    this.onDrain = onDone ?? null;
  }

  /** Cancel everything queued and currently speaking. */
  stop(): void {
    this.queue = [];
    this.buffer = "";
    this.onDrain = null;
    this.active = false;
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    this.setSpeaking(false);
  }

  private enqueue(sentence: string): void {
    this.queue.push(this.transform(sentence));
    this.pump();
  }

  private pump(): void {
    if (this.active) return;
    const next = this.queue.shift();
    if (next === undefined) {
      this.setSpeaking(false);
      const drain = this.onDrain;
      this.onDrain = null;
      drain?.();
      return;
    }

    this.active = true;
    this.setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(next);
    utterance.lang = "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 1;

    const voiceURI = this.getVoiceURI();
    if (voiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI);
      if (voice) utterance.voice = voice;
    }

    const advance = () => {
      // stop() may have run while this utterance was playing.
      if (!this.active) return;
      this.active = false;
      this.pump();
    };
    utterance.onend = advance;
    utterance.onerror = advance;

    window.speechSynthesis.speak(utterance);
  }

  private setSpeaking(speaking: boolean): void {
    if (this.speaking === speaking) return;
    this.speaking = speaking;
    this.onSpeakingChange?.(speaking);
  }
}
