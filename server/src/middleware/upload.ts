import os from "node:os";
import path from "node:path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname) || ".webm";
    cb(null, `interview-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

export const audioUpload = multer({
  storage,
  limits: {
    // Groq documents 25 MB as the free-tier speech-to-text limit.
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const isAudio = file.mimetype.startsWith("audio/");
    const isBrowserWebm = file.mimetype === "video/webm";

    if (isAudio || isBrowserWebm) {
      cb(null, true);
      return;
    }

    cb(new Error("Upload must be an audio file."));
  }
});
