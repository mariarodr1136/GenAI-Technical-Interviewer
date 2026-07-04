import { Briefcase, X } from "lucide-react";
import { useState } from "react";

const MAX_CHARS = 2000;

interface JobDescriptionModalProps {
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

export function JobDescriptionModal({ value, onSave, onClose }: JobDescriptionModalProps) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Job description">
      <div className="modal">
        <div className="modal-header">
          <h2>
            <Briefcase size={17} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            Target Job Description
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="jd-help">
          Paste the job posting you&apos;re preparing for. The interviewer will tailor question
          themes, technologies, and expectations to the role. Applies from your next question
          onward.
        </p>

        <textarea
          className="jd-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
          placeholder="e.g. Junior Software Engineer at Acme — React, Node.js, REST APIs, PostgreSQL…"
          rows={9}
        />
        <span className="jd-count">
          {draft.length}/{MAX_CHARS}
        </span>

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
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
