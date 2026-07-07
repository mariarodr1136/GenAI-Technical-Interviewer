import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { extractResumeText, MAX_RESUME_CHARS } from "../lib/resume.ts";

interface ResumeModalProps {
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function ResumeModal({ value, onSave, onClose }: ResumeModalProps) {
  const [draft, setDraft] = useState(value);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File): Promise<void> {
    setIsParsing(true);
    setParseError("");
    try {
      const text = await extractResumeText(file);
      if (!text) {
        setParseError("No text could be read from that file. Try pasting your resume instead.");
        return;
      }
      setDraft(text);
    } catch {
      setParseError("That file could not be read. Try a different PDF or paste the text.");
    } finally {
      setIsParsing(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Resume">
      <div className="modal">
        <div className="modal-header">
          <h2>
            <FileText size={17} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Your Resume
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="jd-help">
          Upload or paste your resume so the interviewer can ask about your actual projects and
          experience. PDFs are read entirely in your browser — the file itself is never uploaded.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,text/plain,application/pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="resume-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsing}
        >
          {isParsing ? (
            <Loader2 className="spin" size={16} aria-hidden="true" />
          ) : (
            <Upload size={16} aria-hidden="true" />
          )}
          {isParsing ? "Reading file…" : "Upload PDF or text file"}
        </button>

        <textarea
          className="jd-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_RESUME_CHARS))}
          placeholder="…or paste your resume text here."
          rows={9}
          disabled={isParsing}
        />
        <span className="jd-count">
          {draft.length}/{MAX_RESUME_CHARS}
        </span>

        {parseError && <p className="error">{parseError}</p>}

        <div className="jd-actions">
          {value && (
            <button
              type="button"
              className="reset-btn"
              onClick={() => {
                onSave("");
                onClose();
              }}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            className="primary full-width"
            onClick={() => {
              onSave(draft.trim());
              onClose();
            }}
            disabled={isParsing}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
