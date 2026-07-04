import { ChevronDown, Clock, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { RATING_COLOR, TOPICS } from "../constants.ts";
import type { SavedSession } from "../types.ts";
import { RatingChart } from "./RatingChart.tsx";

function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

interface HistoryModalProps {
  sessions: SavedSession[];
  onClearAll: () => void;
  onClose: () => void;
}

export function HistoryModal({ sessions, onClearAll, onClose }: HistoryModalProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Interview history">
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2>Interview History</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {sessions.length > 0 && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => {
                  onClearAll();
                  setExpandedSessionId(null);
                }}
                title="Clear all history"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="history-empty">
            <Clock size={32} strokeWidth={1.3} />
            <p>
              No sessions recorded yet. Complete an interview and click End &amp; Debrief to save
              your first session.
            </p>
          </div>
        ) : (
          <>
            {sessions.length >= 2 && (
              <div className="chart-wrap">
                <span className="debrief-label">Readiness Trend</span>
                <div className="chart-legend">
                  {(["Needs Practice", "Developing", "Solid", "Strong"] as const).map((r, i) => (
                    <span key={r} className="chart-legend-item">
                      <span className="chart-legend-dot" style={{ bottom: `${(i / 3) * 100}%` }} />
                      {r}
                    </span>
                  ))}
                </div>
                <RatingChart sessions={sessions} />
              </div>
            )}

            <div className="history-list">
              {sessions.map((s) => (
                <div key={s.id} className="history-card">
                  <div
                    className="history-card-header"
                    onClick={() => setExpandedSessionId(expandedSessionId === s.id ? null : s.id)}
                  >
                    <div className="history-card-meta">
                      <span className="history-date">{formatSessionDate(s.date)}</span>
                      <div className="tag-row">
                        <span className="tag">
                          {TOPICS.find((t) => t.value === s.topic)?.label ?? s.topic}
                        </span>
                        <span className="tag">{s.difficulty}</span>
                        <span className="tag">{s.persona}</span>
                      </div>
                    </div>
                    <div className="history-card-right">
                      {s.debrief?.readinessRating && (
                        <span
                          className={`rating-badge rating-${RATING_COLOR[s.debrief.readinessRating] ?? "teal"}`}
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          {s.debrief.readinessRating}
                        </span>
                      )}
                      <span className="history-turns">
                        {s.turnCount} turn{s.turnCount !== 1 ? "s" : ""}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`history-chevron ${expandedSessionId === s.id ? "open" : ""}`}
                      />
                    </div>
                  </div>

                  {expandedSessionId === s.id && (
                    <div className="history-transcript">
                      {s.conversation.map((m, i) => (
                        <article
                          key={i}
                          className={m.role === "user" ? "turn user-turn" : "turn interviewer-turn"}
                          style={{ maxWidth: "unset" }}
                        >
                          <span>{m.role === "user" ? "You" : "Interviewer"}</span>
                          <p>{m.content}</p>
                          {m.code && (
                            <pre className="code-block">
                              <code>{m.code}</code>
                            </pre>
                          )}
                        </article>
                      ))}
                      {s.debrief && (
                        <div className="debrief-block" style={{ marginTop: 8 }}>
                          <span className="debrief-label">Debrief Summary</span>
                          <p style={{ marginBottom: 4 }}>
                            <strong>Strengths:</strong> {s.debrief.strengths}
                          </p>
                          <p>
                            <strong>Improve:</strong> {s.debrief.areasToImprove}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
