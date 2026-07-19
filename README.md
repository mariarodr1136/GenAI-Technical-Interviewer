# GenAI Technical Interviewer 🎙️

[![CI](https://github.com/mariarodr1136/GenAI-Technical-Interviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/mariarodr1136/GenAI-Technical-Interviewer/actions/workflows/ci.yml) ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6) ![React](https://img.shields.io/badge/React_19-Frontend-61DAFB) ![Node.js](https://img.shields.io/badge/Node.js_22-Backend-339933) ![Express](https://img.shields.io/badge/Express_5-API-000000) ![Groq](https://img.shields.io/badge/Groq-Whisper_+_Qwen3.6-F55036) ![Vitest](https://img.shields.io/badge/Vitest-93_tests-6E9F18)

A voice-driven mock technical interviewer. Answer questions aloud, attach and run real code, and get spoken AI follow-ups in real time — the interviewer's replies stream from the LLM and are spoken sentence-by-sentence as they arrive. Sessions end with a structured debrief: strengths, areas to improve, and a readiness rating tracked across sessions.

Built with a **React 19 + TypeScript** frontend and a **Node.js/Express (TypeScript)** backend, using **Groq Whisper Large v3** for speech-to-text, **Groq Qwen3.6 27B** for interviewer reasoning, and the browser's native **Web Speech API** for text-to-speech — a deliberately free-tier-friendly architecture with no paid TTS and no database.

**Live app:** https://genai-technical-interviewer-1.onrender.com/

> Hosted on Render's free tier — the backend may take up to a minute to wake after inactivity. The landing page pings the server in the background so it's usually warm by the time you start.

https://github.com/user-attachments/assets/26e1f829-82ba-47d4-ae72-aedfc8625eff

---

## Table of Contents

- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Contact](#contact-)

---

## Highlights

- **Real-time voice loop** — record with `MediaRecorder`, transcribe via Whisper, stream the LLM reply over SSE, and speak it sentence-by-sentence while it's still generating. Hands-free mode auto-stops on silence and auto-starts the next turn.
- **Coding mode with in-browser execution** — attach code to any answer and run JavaScript in a sandboxed Web Worker or Python via Pyodide (WebAssembly); the interviewer reviews your implementation *and* its actual output.
- **Personalized sessions** — paste a job description to tailor questions to the role, and upload a resume (PDF parsed entirely client-side — it never leaves your machine) so the interviewer asks about your real experience.
- **Structured interview formats** — system design sessions follow real phases (requirements → high-level design → deep dive → trade-offs); behavioral sessions coach the STAR method and push for measurable results.
- **Debrief and progress tracking** — schema-validated AI session summaries with a readiness rating, a trend chart across past sessions, and exportable Markdown reports.
- **Configurable interviews** — six topics, three difficulty levels, four interviewer personas, hints on demand, text-input fallback, dark mode, keyboard shortcuts, and an installable PWA.
- **Production-minded backend** — strict server-side input validation, per-IP rate limiting, request timeouts with retries, upstream aborts on client disconnect, and friendly error mapping.
- **Tested and CI-gated** — 93 Vitest tests (Supertest routes with a mocked Groq SDK, Testing Library components/hooks) plus a Playwright e2e smoke test; GitHub Actions runs lint, typecheck, tests, build, and e2e on every push.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript (strict), Vite, custom hooks (`useRecorder`, `useTTS`, `useCountdown`), MediaRecorder + Web Audio + Web Speech APIs, pdf.js, Web Workers + Pyodide |
| **Backend** | Node.js 22 + TypeScript (native type stripping, zero build step), Express 5, Multer, express-rate-limit, Groq SDK |
| **AI** | Groq Whisper Large v3 (STT), Groq Qwen3.6 27B (reasoning + JSON-mode debrief), dynamic per-session prompt engineering |
| **Quality** | Vitest, Supertest, Testing Library, Playwright, ESLint 9 + typescript-eslint, Prettier, GitHub Actions CI, npm workspaces |

<img width="1470" height="803" alt="Interview session" src="https://github.com/user-attachments/assets/b360e486-64d9-4eaa-ba81-c2774db75815" />

<img width="1470" height="789" alt="Landing page" src="https://github.com/user-attachments/assets/84b4601b-d1b4-4953-bb3e-047d41d39581" />

---

## Getting Started

**Prerequisites:** Node.js 22.18+, npm, a Groq API key, and a browser with microphone support.

```bash
# 1. Clone and install
git clone https://github.com/mariarodr1136/GenAI-Technical-Interviewer.git
cd GenAI-Technical-Interviewer
npm install

# 2. Configure the backend
cp server/.env.example server/.env
# then set GROQ_API_KEY=gsk_your_actual_key_here in server/.env

# 3. Run client + server together
npm run dev
```

The app runs at http://localhost:3000 (Express backend on http://localhost:8080).

### Development Workflow

| Command | What it does |
|---|---|
| `npm run dev` | Runs the Express server and Vite client together |
| `npm test` | Server and client test suites (Vitest, Groq mocked) |
| `npm run e2e` | Playwright smoke test (starts the client dev server itself) |
| `npm run typecheck` | Type-checks both workspaces with `tsc --noEmit` |
| `npm run lint` | ESLint across client and server |
| `npm run format` | Prettier write |
| `npm run build` | Production client build |

All of these run in CI on every push and pull request.

---

## Project Structure

```
GenAI Technical Interviewer/
├── .github/workflows/ci.yml        # Lint, typecheck, test, build, e2e on every push
├── client/                         # React + TypeScript frontend (Vite)
│   └── src/
│       ├── components/             # Control panel, conversation log, modals (debrief,
│       │                           #   history, job description, resume), settings bar
│       ├── hooks/                  # useRecorder (mic + silence auto-stop), useTTS, useCountdown
│       ├── lib/                    # Typed API client (SSE), sandboxed code runner,
│       │                           #   history, prefs, resume parsing, report export, TTS queue
│       ├── styles/                 # Per-area stylesheets, light/dark themes
│       ├── App.tsx                 # Session orchestration
│       ├── LandingPage.tsx         # Homepage + backend warm-up ping
│       └── test/                   # Client Vitest suite
├── server/                         # Node/Express backend (TypeScript, no build step)
│   ├── src/
│   │   ├── app.ts                  # Express app factory, trust proxy, rate limiting
│   │   ├── controllers/            # Voice turn, text turn, start, hint, debrief
│   │   ├── prompts/                # Dynamic prompt builder (topic/difficulty/persona/JD)
│   │   ├── services/groqService.ts # STT, streaming LLM replies, hint, debrief
│   │   ├── middleware/ routes/ utils/ config/
│   │   └── index.ts                # Entry point + graceful shutdown
│   └── test/                       # Vitest + Supertest suite (Groq SDK mocked)
└── package.json                    # npm workspace scripts
```

---

## API Overview

All `/api` routes are rate-limited to 30 requests per 15-minute window per IP. `topic`, `difficulty`, and `persona` are whitelist-validated server-side; `jobDescription`, `resume`, and `code` are length-capped.

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health check (used for keep-alive and warm-up pings) |
| `/api/interview/start` | POST | Opens a session; returns the first question |
| `/api/interview/turn` | POST | Voice turn — multipart audio upload, SSE streamed reply |
| `/api/interview/text-turn` | POST | Typed answer, same SSE reply format |
| `/api/interview/hint` | POST | One-sentence nudge based on conversation history |
| `/api/interview/debrief` | POST | Schema-validated JSON session summary + readiness rating |

<details>
<summary><strong>SSE stream format & sample requests</strong></summary>

Turn responses are Server-Sent Events — the transcript arrives first, then reply deltas as they stream from the LLM:

```
data: {"transcript":"I would use a stack and scan each character."}

data: {"delta":"Good start. "}
data: {"delta":"What would you store on the stack?"}

data: {"done":true,"reply":"Good start. What would you store on the stack?"}
```

Errors mid-stream arrive as `data: {"error":"..."}`. If the client disconnects, the server aborts the upstream Groq request.

```bash
# Voice turn
curl -N -X POST http://localhost:8080/api/interview/turn \
  -F "audio=@candidate-answer.webm" \
  -F 'history=[]' -F 'topic=algorithms' -F 'difficulty=medium'

# Text turn
curl -N -X POST http://localhost:8080/api/interview/text-turn \
  -H "Content-Type: application/json" \
  -d '{"text": "I would use a hash map to count character frequencies.", "history": "[]", "topic": "algorithms"}'
```

Shared optional fields on `start`, `turn`, and `text-turn`: `topic` (`general`, `algorithms`, `system-design`, `frontend`, `backend`, `behavioral`), `difficulty` (`easy`/`medium`/`hard`), `persona` (`professional`/`strict`/`encouraging`/`fast-paced`), `jobDescription`, `resume`, and `code` (turns only).

</details>

---

## Deployment

The frontend and backend deploy separately:

- **Frontend** — deploy `client/` as a static Vite build; set `VITE_API_BASE_URL` to the backend URL
- **Backend** — deploy `server/` as a Node.js 22.18+ web service (`npm run start`; the TypeScript sources run directly, no build step)

Backend environment variables:

```bash
PORT=8080
CLIENT_ORIGIN=https://your-frontend-url.com   # allowed CORS origin
GROQ_API_KEY=gsk_your_key_here                # server-only secret
GROQ_STT_MODEL=whisper-large-v3
GROQ_LLM_MODEL=qwen/qwen3.6-27b
```

---

## Contributing

Issues and pull requests are welcome — bug fixes, new interview modes, personas, or scoring rubrics.

1. Fork the repository and create a branch (`feat/your-feature` or `fix/your-bug-fix`)
2. Make your changes and run the checks: `npm run lint && npm run typecheck && npm test && npm run build`
3. Push your branch and open a pull request describing your changes and testing performed

---

## Contact 🌐

Questions or feedback? Reach out at [mrodr.contact@gmail.com](mailto:mrodr.contact@gmail.com).
