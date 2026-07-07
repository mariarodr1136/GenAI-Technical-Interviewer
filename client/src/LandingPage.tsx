import {
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Lightbulb,
  ListChecks,
  Mic,
  Shield,
  Sparkles,
  Volume2,
  Zap
} from "lucide-react";
import { useEffect, useRef } from "react";
import { warmServer } from "./lib/api.ts";

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
    title: "Pick Your Setup",
    desc: "Choose a topic (Algorithms, System Design, Behavioral…), difficulty level, and interviewer persona — strict, encouraging, or fast-paced."
  },
  {
    n: "02",
    title: "Practice Out Loud",
    desc: "Hit Begin Interview, speak your answers, and the AI responds in real time. Switch to text mode any time if you prefer typing."
  },
  {
    n: "03",
    title: "Review & Improve",
    desc: "Get a session debrief with an AI readiness rating, strengths, and targeted improvement tips. Track your progress over multiple sessions."
  }
];

const TOPICS = ["Algorithms", "System Design", "Frontend", "Backend", "Behavioral", "General CS"];

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const featuresRef = useRef<HTMLDivElement | null>(null);

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
      <section className="lp-hero">
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
      <section className="lp-section lp-features-section">
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

            <div className="lp-features-track" ref={featuresRef}>
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
      <section className="lp-section lp-how-section">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <p className="lp-section-eyebrow">How It Works</p>
            <h2 className="lp-h2">Ready in under 60 seconds</h2>
          </div>

          <div className="lp-steps">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="lp-step">
                <div className="lp-step-num">{n}</div>
                <div>
                  <h3 className="lp-step-title">{title}</h3>
                  <p className="lp-step-desc">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Topics ──────────────────────────────────────────────────────── */}
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
            {TOPICS.map((label) => (
              <div key={label} className="lp-topic-card">
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
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="lp-cta-banner">
        <div className="lp-cta-inner">
          <p className="lp-cta-label">No signup. No cost. No limits.</p>
          <button className="lp-cta-launch-btn" onClick={onEnter}>
            <Mic size={16} />
            Launch the Interviewer
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <span className="lp-logo-mark lp-logo-mark-sm">G</span>
          <span>GenAI Interviewer</span>
        </div>
        <p className="lp-footer-tagline">Practice smarter. Interview better.</p>
        <p className="lp-footer-powered">
          Built with React · Groq Whisper STT · Qwen3.6 27B · Browser TTS
        </p>
      </footer>
    </div>
  );
}
