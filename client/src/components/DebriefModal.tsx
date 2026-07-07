import { Download, X } from "lucide-react";
import { RATING_COLOR } from "../constants.ts";
import { downloadDebriefReport } from "../lib/report.ts";
import type { SavedSession } from "../types.ts";

export function DebriefModal({ session, onClose }: { session: SavedSession; onClose: () => void }) {
  const debrief = session.debrief;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Session debrief">
      <div className="modal">
        <div className="modal-header">
          <h2>Session Debrief</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => downloadDebriefReport(session)}
              title="Download report (Markdown)"
            >
              <Download size={16} />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
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

        <button
          type="button"
          className="hint-btn full-width"
          onClick={() => downloadDebriefReport(session)}
        >
          <Download size={16} aria-hidden="true" />
          Download Report
        </button>

        <button type="button" className="primary full-width" onClick={onClose}>
          Start New Session
        </button>
      </div>
    </div>
  );
}
