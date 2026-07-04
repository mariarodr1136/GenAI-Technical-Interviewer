import { X } from "lucide-react";
import { RATING_COLOR } from "../constants.ts";
import type { Debrief } from "../types.ts";

export function DebriefModal({ debrief, onClose }: { debrief: Debrief; onClose: () => void }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Session debrief">
      <div className="modal">
        <div className="modal-header">
          <h2>Session Debrief</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
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
                {debrief.topicsCovered.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
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

        <button type="button" className="primary full-width" onClick={onClose}>
          Start New Session
        </button>
      </div>
    </div>
  );
}
