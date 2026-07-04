import { RATING_VALUE } from "../constants.ts";
import type { SavedSession } from "../types.ts";

export function RatingChart({ sessions }: { sessions: SavedSession[] }) {
  const rated = sessions
    .filter((s) => s.debrief?.readinessRating && RATING_VALUE[s.debrief.readinessRating])
    .slice(0, 10)
    .reverse();

  if (rated.length < 2) return null;

  const W = 300,
    H = 72,
    PAD = 12;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;
  const xStep = innerW / (rated.length - 1);
  const yScale = innerH / 3;

  const pts = rated.map((s, i) => ({
    x: PAD + i * xStep,
    y: H - PAD - (RATING_VALUE[s.debrief.readinessRating] - 1) * yScale
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rating-chart" aria-label="Rating trend over sessions">
      {[1, 2, 3, 4].map((v) => (
        <line
          key={v}
          x1={PAD}
          y1={H - PAD - (v - 1) * yScale}
          x2={W - PAD}
          y2={H - PAD - (v - 1) * yScale}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}
      <polyline
        points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="none"
        stroke="var(--teal)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--teal)" />
      ))}
    </svg>
  );
}
