import {
  ArrowRight,
  Binary,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  GraduationCap,
  LayoutTemplate,
  Lightbulb,
  ListChecks,
  MessagesSquare,
  Mic,
  Network,
  Server,
  Shield,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Volume2,
  Zap
} from "lucide-react";
import { useEffect, useRef } from "react";
import useSectionSnap from "./hooks/useSectionSnap.ts";
import { warmServer } from "./lib/api.ts";

/** Scroll snaps move between these, one gesture at a time. */
const SECTION_IDS = ["lp-hero", "lp-features", "lp-how", "lp-topics"];

const FEATURES = [
  {
    icon: Mic,
    title: "Voice-Powered Practice",
    desc: "Answer naturally by speaking, just like a real interview. Groq Whisper transcribes in real time, and hands-free mode detects when you finish so the conversation just flows."
  },
  {
    icon: Brain,
    title: "AI That Adapts to You",
    desc: "Powered by Qwen3.6 27B, your interviewer adjusts question depth and follow-ups based on your answers — no two sessions are the same."
  },
  {
    icon: Code2,
    title: "Run Your Code Live",
    desc: "Attach real code and execute it right in your browser — JavaScript in a sandboxed runner or Python via WebAssembly. The interviewer reacts to what your code actually does."
  },
  {
    icon: FileText,
    title: "Resume & Job Tailoring",
    desc: "Upload your resume (parsed privately in your browser) and paste a target job posting — questions are grounded in your real projects and the role you want."
  },
  {
    icon: ListChecks,
    title: "Real Interview Structure",
    desc: "System design sessions move through requirements, high-level design, deep dives, and trade-offs. Behavioral sessions coach you through the STAR method."
  },
  {
    icon: Lightbulb,
    title: "Debrief, Reports & Trends",
    desc: "Every session ends with strengths, areas to improve, and a readiness rating — downloadable as a Markdown report, with a trend chart across sessions."
  }
];

const STEPS = [
  {
    n: "01",
    icon: SlidersHorizontal,
    title: "Pick Your Setup",
    desc: "Choose a topic (Algorithms, System Design, Behavioral…), difficulty level, and interviewer persona — strict, encouraging, or fast-paced."
  },
  {
    n: "02",
    icon: Mic,
    title: "Practice Out Loud",
    desc: "Hit Begin Interview, speak your answers, and the AI responds in real time. Switch to text mode any time if you prefer typing."
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Review & Improve",
    desc: "Get a session debrief with an AI readiness rating, strengths, and targeted improvement tips. Track your progress over multiple sessions."
  }
];

const TOPICS = [
  { label: "Algorithms", icon: Binary },
  { label: "System Design", icon: Network },
  { label: "Frontend", icon: LayoutTemplate },
  { label: "Backend", icon: Server },
  { label: "Behavioral", icon: MessagesSquare },
  { label: "General CS", icon: GraduationCap }
];

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const featuresRef = useRef<HTMLDivElement | null>(null);

  useSectionSnap(SECTION_IDS);

  // The backend runs on a free tier that sleeps when idle. Pinging it while
  // the visitor reads the landing page means the interview starts warm.
  useEffect(() => {
    warmServer();
  }, []);

  function scrollFeatures(direction: -1 | 1): void {
    const track = featuresRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".lp-feature-card");
    const step = card ? card.offsetWidth + 16 : 360;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className="lp-root">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="lp-hero lp-panel" id="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-eyebrow">
            <Zap size={13} />
            Powered by Qwen3.6 27B &amp; Groq Whisper
          </div>

          <h1 className="lp-h1">
            Ace Your Next
            <br />
            <span className="lp-h1-accent">Technical Interview</span>
          </h1>

          <p className="lp-hero-sub">
            Voice-driven AI mock interviews with instant feedback. Practice algorithms, system
            design, behavioral questions, and more — no signup, completely free.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-hero-btn-primary" onClick={onEnter}>
              <Mic size={18} />
              Start Practicing Free
            </button>
            <span className="lp-hero-note">
              <CheckCircle size={14} />
              No account needed
            </span>
          </div>

          {/* ── Mock UI preview ─────────────────────────────────────────── */}
          <div className="lp-preview">
            <div className="lp-preview-bar">
              <span className="lp-preview-dot" style={{ background: "#ef4444" }} />
              <span className="lp-preview-dot" style={{ background: "#f59e0b" }} />
              <span className="lp-preview-dot" style={{ background: "#22c55e" }} />
              <span className="lp-preview-title">GenAI Interviewer — System Design · Hard</span>
            </div>
            <div className="lp-preview-body">
              <div className="lp-bubble lp-bubble-ai">
                <span className="lp-bubble-label">Interviewer</span>
                <p>
                  Design a distributed rate limiter that can handle 100 million requests per second
                  across global data centers. Walk me through your approach.
                </p>
              </div>
              <div className="lp-bubble lp-bubble-user">
                <span className="lp-bubble-label">You</span>
                <p>I'd start with a token bucket algorithm at the edge using Redis Cluster…</p>
              </div>
              <div className="lp-pulse-row">
                <span className="lp-pulse-dot" />
                <span className="lp-pulse-text">AI is listening…</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="lp-section lp-features-section lp-panel" id="lp-features">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <p className="lp-section-eyebrow">Why GenAI Interviewer</p>
            <h2 className="lp-h2">Everything you need to prepare</h2>
            <p className="lp-section-sub">
              Built for engineers who want realistic practice — not scripted flashcards.
            </p>
          </div>

          <div className="lp-carousel">
            <button
              type="button"
              className="lp-carousel-btn"
              onClick={() => scrollFeatures(-1)}
              aria-label="Previous features"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              className="lp-features-track"
              ref={featuresRef}
              role="region"
              aria-label="Feature highlights"
              tabIndex={0}
            >
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="lp-feature-card">
                  <div className="lp-feature-icon">
                    <Icon size={22} />
                  </div>
                  <h3 className="lp-feature-title">{title}</h3>
                  <p className="lp-feature-desc">{desc}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="lp-carousel-btn"
              onClick={() => scrollFeatures(1)}
              aria-label="More features"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="lp-section lp-how-section lp-panel" id="lp-how">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <p className="lp-section-eyebrow">How It Works</p>
            <h2 className="lp-h2">Ready in under 60 seconds</h2>
          </div>

          <div className="lp-steps">
            {STEPS.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="lp-step">
                <div className="lp-step-num">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="lp-step-eyebrow">Step {n}</p>
                  <h3 className="lp-step-title">{title}</h3>
                  <p className="lp-step-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics + CTA + footer (one snap panel) ──────────────────────── */}
      <div className="lp-panel lp-end-panel" id="lp-topics">
        <section className="lp-section lp-topics-section">
          <div className="lp-section-inner">
            <div className="lp-section-header">
              <p className="lp-section-eyebrow">Topic Coverage</p>
              <h2 className="lp-h2">Practice any area, any time</h2>
              <p className="lp-section-sub">
                Six topic tracks · three difficulty levels · four interviewer styles
              </p>
            </div>

            <div className="lp-topics-grid">
              {TOPICS.map(({ label, icon: Icon }) => (
                <div key={label} className="lp-topic-card">
                  <span className="lp-topic-icon">
                    <Icon size={17} />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="lp-topics-perks">
              {[
                { icon: Volume2, text: "Voice or text input" },
                { icon: Shield, text: "Runs in your browser — no data stored" },
                { icon: Sparkles, text: "Hint system to get unstuck" }
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="lp-perk">
                  <Icon size={16} />
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA lives on this panel so the closing screen isn't half empty. */}
            <div className="lp-cta-inner">
              <button className="lp-cta-launch-btn" onClick={onEnter}>
                <Mic size={16} />
                Launch the Interviewer
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <p className="lp-footer-powered">
            Built with React · Groq Whisper STT · Qwen3.6 27B · Browser TTS
          </p>
        </footer>
      </div>
    </div>
  );
}
