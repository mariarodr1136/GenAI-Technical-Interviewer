export function speakText(text, { onStart, onEnd, voiceURI } = {}) {
  if (!("speechSynthesis" in window)) {
    throw new Error("This browser does not support speech synthesis.");
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.96;
  utterance.pitch = 1;

  if (voiceURI) {
    const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI);
    if (voice) utterance.voice = voice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
