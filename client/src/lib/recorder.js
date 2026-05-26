const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus"
];

export function getSupportedAudioMimeType() {
  if (!("MediaRecorder" in window)) {
    return "";
  }

  return PREFERRED_MIME_TYPES.find((mimeType) =>
    MediaRecorder.isTypeSupported(mimeType)
  ) ?? "";
}

export function getFileExtension(mimeType) {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  return "webm";
}
